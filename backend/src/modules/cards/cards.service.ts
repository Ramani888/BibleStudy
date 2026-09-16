import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { storeCardEmbedding } from '../ai/embeddings.service';
import {
  CreateCardDtoType,
  BulkCreateCardsDtoType,
  UpdateCardDtoType,
  ReorderCardsDtoType,
} from './cards.dto';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { fsrs, createEmptyCard, Rating, State } from 'ts-fsrs';

const fsrsScheduler = fsrs();

/**
 * Spaced-repetition summary for the Home "TODAY" card: how many of the user's
 * cards are due for review now, across how many sets, and the set with the most
 * due cards (so Home can deep-link straight into the set that needs review).
 */
/**
 * The user's cards due for spaced-repetition review (nextReviewAt <= now),
 * most-overdue first. Owner-scoped. Powers the "Review due cards" quiz — a real,
 * tracked session (records + updates SM-2), unlike ephemeral AI quizzes.
 */
// ponytail: "due" uses a raw UTC instant (nextReviewAt <= now), not the user's
// local midnight — we store no timezone. Near a user's day boundary the due count
// can be off by one. Add a client tz-offset param if this becomes a real complaint.
export async function getDueCards(userId: string, limit = 50) {
  return prisma.card.findMany({
    where: { set: { userId }, nextReviewAt: { lte: new Date() } },
    orderBy: { nextReviewAt: 'asc' },
    take: limit,
  });
}

// A card is "learned" once its SM-2 interval reaches maturity (Anki's convention
// is 21 days). Mastery% per set = learned / total.
const MATURE_INTERVAL_DAYS = 21;

/**
 * Per-set mastery: share of cards whose SM-2 interval has reached maturity.
 * Owner-scoped. Returns one row per set that has cards.
 */
export async function getMasteryBySet(userId: string): Promise<{ setId: string; total: number; learned: number; masteryPct: number }[]> {
  const [totals, learned] = await Promise.all([
    prisma.card.groupBy({ by: ['setId'], where: { set: { userId } }, _count: { _all: true } }),
    prisma.card.groupBy({ by: ['setId'], where: { set: { userId }, interval: { gte: MATURE_INTERVAL_DAYS } }, _count: { _all: true } }),
  ]);
  const learnedMap = new Map(learned.map(l => [l.setId, l._count._all]));
  return totals.map(t => {
    const total = t._count._all;
    const learnedCount = learnedMap.get(t.setId) ?? 0;
    return { setId: t.setId, total, learned: learnedCount, masteryPct: total > 0 ? Math.round((learnedCount / total) * 100) : 0 };
  });
}

export async function getDueSummary(userId: string) {
  const grouped = await prisma.card.groupBy({
    by: ['setId'],
    where: { set: { userId }, nextReviewAt: { lte: new Date() } },
    _count: { _all: true },
  });

  const dueCount = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const dueSets = grouped.length;

  let topSet: { id: string; title: string } | null = null;
  if (grouped.length > 0) {
    const top = grouped.reduce((a, b) => (b._count._all > a._count._all ? b : a));
    topSet = await prisma.set.findUnique({
      where: { id: top.setId },
      select: { id: true, title: true },
    });
  }

  return { dueCount, dueSets, topSet };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Spaced-repetition update (SM-2). The quiz grade is binary, so map
 * correct→quality 5, wrong→quality 2 into the classic SM-2 ease/interval
 * formula. Only the user's own cards are touched (skips friend/public-set
 * cards a quiz may include).
 *
 * ponytail: no sub-day learning steps — a wrong card reschedules +1 day, not
 * "+10 min". Add Anki-style learning steps only if users start cramming.
 */
type ReviewCard = {
  interval: number; ease: number; nextReviewAt: Date | null; lastStudiedAt: Date | null;
  fsrsStability: number | null; fsrsDifficulty: number | null; fsrsReps: number; fsrsLapses: number; fsrsState: number; fsrsLearningSteps: number;
};

// Classic SM-2 (default). Binary grade → quality 5 (correct) / 2 (wrong).
function sm2Update(card: ReviewCard, correct: boolean, now: Date) {
  const q = correct ? 5 : 2;
  const ease = Math.max(1.3, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const interval = !correct ? 0 : card.interval === 0 ? 1 : card.interval === 1 ? 6 : Math.round(card.interval * ease);
  return { interval, ease, nextReviewAt: new Date(now.getTime() + Math.max(1, interval) * DAY_MS), lastStudiedAt: now };
}

// FSRS via ts-fsrs (opt-in). Binary grade → Good (correct) / Again (wrong).
// Reconstructs the FSRS card from stored state; seeds from SM-2 maturity when a
// user first enables FSRS (so a mature card isn't reset to New); else starts fresh.
function fsrsUpdate(card: ReviewCard, correct: boolean, now: Date) {
  // ts-fsrs derives retrievability from now − last_review; pass the real elapsed
  // days so a card reviewed late isn't treated as reviewed immediately.
  const elapsed = card.lastStudiedAt
    ? Math.max(0, Math.round((now.getTime() - card.lastStudiedAt.getTime()) / DAY_MS))
    : 0;
  let fcard: Parameters<typeof fsrsScheduler.next>[0];
  if (card.fsrsStability != null) {
    // Existing FSRS state.
    fcard = {
      due: card.nextReviewAt ?? now,
      stability: card.fsrsStability,
      difficulty: card.fsrsDifficulty ?? 0,
      elapsed_days: elapsed,
      scheduled_days: card.interval,
      reps: card.fsrsReps,
      lapses: card.fsrsLapses,
      learning_steps: card.fsrsLearningSteps,
      state: card.fsrsState,
      last_review: card.lastStudiedAt ?? undefined,
    };
  } else if (card.interval > 0) {
    // Migrating SM-2 → FSRS: seed from accumulated maturity. SM-2 interval (days)
    // ≈ FSRS stability at 90% recall; difficulty seeds neutral and self-tunes.
    // ponytail: one-way seed. FSRS → SM-2 (disabling FSRS) still reads card.ease,
    // which FSRS never maintains — switching back mid-history is not supported.
    fcard = {
      due: card.nextReviewAt ?? now,
      stability: Math.max(1, card.interval),
      difficulty: 5,
      elapsed_days: elapsed,
      scheduled_days: card.interval,
      reps: card.fsrsReps,
      lapses: card.fsrsLapses,
      learning_steps: card.fsrsLearningSteps,
      state: State.Review,
      last_review: card.lastStudiedAt ?? undefined,
    };
  } else {
    // Never studied under either scheduler.
    fcard = createEmptyCard(now);
  }
  const { card: n } = fsrsScheduler.next(fcard, now, correct ? Rating.Good : Rating.Again);
  return {
    interval: n.scheduled_days,
    nextReviewAt: n.due,
    lastStudiedAt: now,
    fsrsStability: n.stability,
    fsrsDifficulty: n.difficulty,
    fsrsReps: n.reps,
    fsrsLapses: n.lapses,
    fsrsState: n.state as number,
    fsrsLearningSteps: n.learning_steps ?? 0,
  };
}

export async function applyReviews(
  userId: string,
  results: { cardId: string; correct: boolean }[],
  setIds?: string[],
) {
  if (results.length === 0) return;
  // Dedupe by cardId (keep the last grade) — two updates for the same card in one
  // $transaction would both compute from the pre-review snapshot and the first
  // would be lost. Normal flow yields one item per card; this is defensive.
  const reviews = [...new Map(results.map(r => [r.cardId, r])).values()];

  // Read -> compute -> write must be atomic per user. Otherwise two concurrent submissions both read
  // the pre-review snapshot and one write is lost: e.g. a wrong answer's lapse (mature interval->0)
  // gets overwritten by a concurrent correct answer computed from the OLD mature interval (->~260d),
  // postponing the card for months and inflating mastery, and it does NOT self-correct. A per-user
  // advisory xact lock (same pattern as the folders module) serializes a user's review writes.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { useFsrs: true } });
    const cards = await tx.card.findMany({
      // Owner-scoped, and (when setIds is PROVIDED, even empty) constrained to it so an injected
      // cardId from an unrelated set can't be rescheduled. undefined = owner-scope only.
      where: { id: { in: reviews.map(r => r.cardId) }, set: { userId }, ...(setIds !== undefined ? { setId: { in: setIds } } : {}) },
      select: {
        id: true, interval: true, ease: true, nextReviewAt: true, lastStudiedAt: true,
        fsrsStability: true, fsrsDifficulty: true, fsrsReps: true, fsrsLapses: true, fsrsState: true, fsrsLearningSteps: true,
      },
    });
    const byId = new Map(cards.map(c => [c.id, c]));
    const now = new Date();

    for (const { cardId, correct } of reviews) {
      const card = byId.get(cardId);
      if (!card) continue;
      const data = user?.useFsrs ? fsrsUpdate(card, correct, now) : sm2Update(card, correct, now);
      await tx.card.update({ where: { id: cardId }, data });
    }
  });
}

async function verifySetOwnership(userId: string, setId: string) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) {
    throw new NotFoundError('Set not found');
  }
  return set;
}

async function verifyCardOwnership(cardId: string, userId: string) {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) throw new NotFoundError('Card not found or not authorized');
  return card;
}

// A user-supplied imageId must reference the caller's OWN media — otherwise a card could point at
// another user's MediaFile (cross-user coupling: breaks on their expiry/delete, muddies cleanup).
async function verifyMediaOwnership(userId: string, imageId: string) {
  const media = await prisma.mediaFile.findFirst({ where: { id: imageId, userId }, select: { id: true } });
  if (!media) throw new NotFoundError('Image not found');
}

export async function createCard(userId: string, dto: CreateCardDtoType) {
  await verifySetOwnership(userId, dto.setId);
  if (dto.imageId) await verifyMediaOwnership(userId, dto.imageId);

  const existingCount = await prisma.card.count({ where: { setId: dto.setId } });

  const card = await prisma.card.create({
    data: {
      setId: dto.setId,
      type: dto.type ?? 'QA',
      question: dto.question,
      answer: dto.answer,
      note: dto.note ?? null,
      imageId: dto.imageId ?? null,
      order: dto.order ?? existingCount,
      isBlurred: dto.isBlurred ?? false,
      difficulty: dto.difficulty ?? 'MEDIUM',
      userId,
    },
  });

  await logActivity(userId, 'CREATED_CARD', dto.setId);
  storeCardEmbedding(card.id, card.question, card.answer).catch(() => {});

  return card;
}

export async function bulkCreateCards(userId: string, dto: BulkCreateCardsDtoType) {
  await verifySetOwnership(userId, dto.setId);

  // Every referenced image must be the caller's own media (see verifyMediaOwnership).
  const imageIds = [...new Set(dto.cards.map(c => c.imageId).filter((id): id is string => !!id))];
  if (imageIds.length > 0) {
    const owned = await prisma.mediaFile.count({ where: { id: { in: imageIds }, userId } });
    if (owned !== imageIds.length) throw new NotFoundError('Image not found');
  }

  const existingCount = await prisma.card.count({ where: { setId: dto.setId } });
  // Single bulk INSERT (was up to 100 serial creates inside a 5s interactive transaction, which
  // could time out / hold a connection). createManyAndReturn is one atomic statement that returns rows.
  const cards = await prisma.card.createManyAndReturn({
    data: dto.cards.map((card, index) => ({
      setId: dto.setId,
      question: card.question,
      answer: card.answer,
      note: card.note ?? null,
      imageId: card.imageId ?? null,
      order: card.order ?? existingCount + index,
      isBlurred: card.isBlurred ?? false,
      difficulty: card.difficulty ?? 'MEDIUM',
      userId,
    })),
  });

  Promise.all(cards.map(c => storeCardEmbedding(c.id, c.question, c.answer))).catch(() => {});

  return cards;
}

export async function listCardsBySet(userId: string, setId: string) {
  const set = await prisma.set.findFirst({ where: { id: setId } });
  if (!set) throw new NotFoundError('Set not found');

  if (set.userId !== userId) {
    if (set.visibility === 'PRIVATE') throw new NotFoundError('Set not found');
    if (set.visibility === 'FRIENDS') {
      const friendship = await prisma.friendship.findFirst({ where: { userId, friendId: set.userId } });
      if (!friendship) throw new NotFoundError('Set not found');
    }
    // PUBLIC sets are accessible to all authenticated users
  }

  const cards = await prisma.card.findMany({
    where: { setId },
    orderBy: { order: 'asc' },
  });

  return cards;
}

export async function getCardById(userId: string, cardId: string) {
  return verifyCardOwnership(cardId, userId);
}

export async function updateCard(userId: string, cardId: string, dto: UpdateCardDtoType) {
  const existing = await verifyCardOwnership(cardId, userId);
  if (dto.imageId) await verifyMediaOwnership(userId, dto.imageId); // null clears the image (no check)

  // Validate the MERGED result, not just the patch: a QA card must keep a >=2-char question
  // (CreateCardDto enforces this; without it PUT {question:""} or {type:"QA"} corrupts the card).
  const effectiveType = dto.type ?? existing.type;
  const effectiveQuestion = dto.question ?? existing.question;
  if (effectiveType === 'QA' && effectiveQuestion.trim().length < 2) {
    throw new ValidationError('Question must be at least 2 characters');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.question !== undefined && { question: dto.question }),
      ...(dto.answer !== undefined && { answer: dto.answer }),
      ...(dto.imageId !== undefined && { imageId: dto.imageId }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.isBlurred !== undefined && { isBlurred: dto.isBlurred }),
      ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
    },
  });

  if (dto.question !== undefined || dto.answer !== undefined) {
    storeCardEmbedding(updated.id, updated.question, updated.answer).catch(() => {});
  }

  return updated;
}

export async function deleteCard(userId: string, cardId: string) {
  await verifyCardOwnership(cardId, userId);

  await prisma.card.deleteMany({ where: { id: cardId, userId } });

  return { message: 'Card deleted successfully' };
}

export async function copyCard(userId: string, cardId: string) {
  const card = await verifyCardOwnership(cardId, userId);

  const maxOrder = await prisma.card.aggregate({
    where: { setId: card.setId },
    _max: { order: true },
  });

  const copy = await prisma.card.create({
    data: {
      setId: card.setId,
      type: card.type, // preserve QA vs STORY (omitting it defaulted the copy to QA)
      question: card.question,
      answer: card.answer,
      note: card.note,
      imageId: card.imageId,
      order: (maxOrder._max.order ?? 0) + 1,
      isBlurred: card.isBlurred,
      difficulty: card.difficulty,
      userId,
    },
  });

  // Index the copy for AI retrieval (createCard/bulkCreate/cloneSet all do this).
  storeCardEmbedding(copy.id, copy.question, copy.answer).catch(() => {});

  return copy;
}

export async function moveCard(userId: string, cardId: string, targetSetId: string) {
  await verifyCardOwnership(cardId, userId);
  await verifySetOwnership(userId, targetSetId);

  const maxOrder = await prisma.card.aggregate({
    where: { setId: targetSetId },
    _max: { order: true },
  });

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      setId: targetSetId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return updated;
}

export async function reorderCards(userId: string, dto: ReorderCardsDtoType) {
  await verifySetOwnership(userId, dto.setId); // canonical ownership guard (was only implied by counts)

  // Verify the count matches all cards currently in the set
  const totalCount = await prisma.card.count({ where: { setId: dto.setId, userId } });
  if (totalCount !== dto.cardIds.length) {
    throw new ValidationError('cardIds must include all cards in the set');
  }

  // Verify all provided cards belong to this set and user
  const cards = await prisma.card.findMany({
    where: { id: { in: dto.cardIds }, userId, setId: dto.setId },
  });

  if (cards.length !== dto.cardIds.length) {
    throw new NotFoundError('One or more cards not found');
  }

  const updates = dto.cardIds.map((cardId, index) =>
    prisma.card.update({
      where: { id: cardId },
      data: { order: index },
    })
  );

  await prisma.$transaction(updates);

  return { message: 'Cards reordered successfully' };
}
