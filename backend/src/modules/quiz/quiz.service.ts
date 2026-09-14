import { prisma } from '../../config/db';
import { RecordAttemptDtoType, GenerateQuizDtoType } from './quiz.dto';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { applyReviews } from '../cards/cards.service';
import { generateQuizCards } from '../ai/ai.service';
import { logActivity } from '../../utils/activity';

// Cap cards sent to the LLM to protect the token budget. ponytail: naive cap
// (first N by order); smarter selection (due/least-reviewed) later if needed.
const MAX_GROUNDING_CARDS = 40;

/**
 * Generate an ephemeral AI quiz (delegates to ai.service — it owns the LLM +
 * credit seam). Sets win over topic: if setIds are given, quiz is grounded in
 * the user's own cards; otherwise it's generated from the topic. Nothing is
 * persisted. Card loading is owner-scoped and happens BEFORE any credit charge.
 */
export async function generateQuiz(userId: string, dto: GenerateQuizDtoType) {
  if (dto.setIds && dto.setIds.length > 0) {
    const cards = await prisma.card.findMany({
      where: { setId: { in: dto.setIds }, set: { userId } }, // owner-scoped
      select: { question: true, answer: true },
      orderBy: { order: 'asc' },
      take: MAX_GROUNDING_CARDS,
    });
    if (cards.length === 0) throw new ValidationError('No cards found in the selected sets');
    return generateQuizCards(userId, { cards, count: dto.count });
  }
  if (dto.topic) {
    return generateQuizCards(userId, { topic: dto.topic, count: dto.count });
  }
  throw new ValidationError('Provide a topic or select sets');
}

/**
 * Feed a quiz's per-card results into spaced repetition. Skips unscored
 * 'read' items (their isCorrect is always true) and items without a cardId.
 */
async function applySpacedRepetition(userId: string, dto: RecordAttemptDtoType, setIds: string[] = dto.setIds) {
  if (!dto.responses) return;
  const reviews = dto.responses
    .filter(r => r.mode !== 'read' && r.cardId)
    .map(r => ({ cardId: r.cardId as string, correct: r.isCorrect }));
  // Scope SR to cards in the attempt's own sets — a crafted request can't move the
  // schedule of unrelated cards it slipped into `responses`. Retakes pass the
  // stored row's sets so the PUT payload can't redirect the scope.
  await applyReviews(userId, reviews, setIds);
}

// Trust the graded responses, not the client's claimed total/correct: derive the
// score from the scored (non-'read') responses so a tampered total/correct can't
// forge a %. Falls back to the client numbers only when responses are absent.
// ponytail: grading is client-side, so this bounds casual tampering, not a
// determined cheat — but best% is self-only anyway (leaderboard is streak-based).
function deriveScore(dto: RecordAttemptDtoType): { total: number; correct: number } {
  if (dto.responses && dto.responses.length > 0) {
    const scored = dto.responses.filter(r => r.mode !== 'read');
    if (scored.length > 0) {
      return { total: scored.length, correct: scored.filter(r => r.isCorrect).length };
    }
  }
  return { total: dto.total, correct: dto.correct };
}

export async function recordAttempt(userId: string, dto: RecordAttemptDtoType) {
  // AI quizzes (topic / generated) carry no setIds → recorded set-less (setId null).
  // Real quizzes (review-due, retake) carry their sets and are ownership-checked.
  const primarySetId = dto.setIds[0] ?? null;
  if (dto.setIds.length > 0) {
    const sets = await prisma.set.findMany({ where: { id: { in: dto.setIds }, userId }, select: { id: true } });
    if (sets.length !== dto.setIds.length) throw new NotFoundError('One or more sets not found');
  }

  const { total, correct } = deriveScore(dto);
  const scorePct = Math.round((correct / total) * 100);
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      setId:   primarySetId,
      setIds:  dto.setIds,
      total,
      correct,
      scorePct,
      mode:      dto.mode ?? null,
      quizName:  dto.quizName ?? null,
      topic:     dto.topic ?? null,
      timeSecs:  dto.timeSecs ?? null,
      ...(dto.responses ? { responses: dto.responses } : {}),
    },
  });

  logActivity(userId, 'STUDIED_CARDS', attempt.id);
  // ponytail: the attempt row commits before SR runs (applyReviews has its own
  // inner transaction). A crash in the gap leaves the attempt recorded but the
  // cards not rescheduled — it self-corrects on the next quiz. Not worth threading
  // a tx through the shared applyReviews path pre-launch.
  await applySpacedRepetition(userId, dto);
  // "Best" is per-set — only meaningful for real single-set quizzes, not set-less AI ones.
  const best = primarySetId ? await getBestForSet(userId, primarySetId) : null;
  return { attempt, best };
}

export async function updateAttempt(userId: string, attemptId: string, dto: RecordAttemptDtoType) {
  // A retake keeps the original quiz's identity: load the owned row and scope
  // scoring + SR to ITS sets, never the client-supplied setIds (which could point
  // at unrelated sets). Only the score/time/responses are overwritten.
  const existing = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    select: { setId: true, setIds: true },
  });
  if (!existing) throw new NotFoundError('Attempt not found');
  const setIds = existing.setIds.length > 0 ? existing.setIds : (existing.setId ? [existing.setId] : []);

  const { total, correct } = deriveScore(dto);
  const scorePct = Math.round((correct / total) * 100);
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { total, correct, scorePct, timeSecs: dto.timeSecs ?? null, ...(dto.responses ? { responses: dto.responses } : {}) },
  });
  await applySpacedRepetition(userId, dto, setIds);
  const best = setIds[0] ? await getBestForSet(userId, setIds[0]) : null;
  return { best };
}

export async function deleteAttempt(userId: string, attemptId: string) {
  const deleted = await prisma.quizAttempt.deleteMany({ where: { id: attemptId, userId } });
  if (deleted.count === 0) throw new NotFoundError('Attempt not found');
}

// "Best" reflects single-set quizzes only. A multi-set/review session stores a
// blended score under setIds[0]; crediting that to one set would mislead, so any
// attempt spanning >1 set is excluded. ponytail: O(attempts-for-set) scan — fine
// at per-user attempt volumes; revisit if a user ever accrues thousands.
export async function getBestForSet(userId: string, setId: string): Promise<number | null> {
  const rows = await prisma.quizAttempt.findMany({
    where: { userId, setId },
    select: { scorePct: true, setIds: true },
  });
  const single = rows.filter(r => r.setIds.length <= 1);
  return single.length ? Math.max(...single.map(r => r.scorePct)) : null;
}

export async function getRecentAttempts(userId: string, limit = 20) {
  const rows = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { set: { select: { title: true } } },
  });

  // Set-less AI attempts (setId null, setIds []) contribute no ids here.
  const allSetIds = [...new Set(rows.flatMap(r => r.setIds.length > 0 ? r.setIds : (r.setId ? [r.setId] : [])))];
  const setMap = allSetIds.length > 0
    ? await prisma.set.findMany({ where: { id: { in: allSetIds } }, select: { id: true, title: true } })
        .then(sets => Object.fromEntries(sets.map(s => [s.id, s.title])))
    : {} as Record<string, string>;

  return rows.map(r => {
    const effectiveSetIds = r.setIds.length > 0 ? r.setIds : (r.setId ? [r.setId] : []);
    const setTitles = effectiveSetIds.map(id => setMap[id] ?? r.set?.title ?? '');
    return {
      id:        r.id,
      setId:     r.setId,
      setIds:    effectiveSetIds,
      setTitles,
      setTitle:  r.set?.title ?? '',
      mode:      r.mode,
      scorePct:  r.scorePct,
      total:     r.total,
      correct:   r.correct,
      quizName:    r.quizName ?? undefined,
      topic:       r.topic ?? undefined,
      timeSecs:    r.timeSecs ?? undefined,
      // Included so the hub can offer "Summary" and reconstruct a retake for
      // set-less AI quizzes (whose questions aren't otherwise persisted).
      responses:   r.responses ?? undefined,
      createdAt:   r.createdAt.toISOString(),
      practicedAt: (r.practicedAt ?? r.createdAt).toISOString(),
    };
  });
}

export async function getAttemptResponses(userId: string, attemptId: string) {
  const row = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    select: { responses: true },
  });
  if (!row) throw new NotFoundError('Attempt not found');
  return { responses: row.responses ?? null };
}
