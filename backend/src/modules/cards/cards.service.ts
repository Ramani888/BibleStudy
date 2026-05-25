import { Difficulty } from '@prisma/client';
import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import {
  CreateCardDtoType,
  BulkCreateCardsDtoType,
  UpdateCardDtoType,
  ReorderCardsDtoType,
  StudyCardDtoType,
} from './cards.dto';
import { NotFoundError, ValidationError } from '../../utils/errors';

function calculateNextReviewAt(difficulty: Difficulty): Date {
  const now = new Date();
  switch (difficulty) {
    case 'EASY':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    case 'MEDIUM':
      return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day
    case 'HARD':
      return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    default:
      return new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  }
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

export async function createCard(userId: string, dto: CreateCardDtoType) {
  await verifySetOwnership(userId, dto.setId);

  const existingCount = await prisma.card.count({ where: { setId: dto.setId } });

  const card = await prisma.card.create({
    data: {
      setId: dto.setId,
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

  return card;
}

export async function bulkCreateCards(userId: string, dto: BulkCreateCardsDtoType) {
  await verifySetOwnership(userId, dto.setId);

  const cards = await prisma.$transaction(async (tx) => {
    const existingCount = await tx.card.count({ where: { setId: dto.setId } });
    return Promise.all(
      dto.cards.map((card, index) =>
        tx.card.create({
          data: {
            setId: dto.setId,
            question: card.question,
            answer: card.answer,
            note: card.note ?? null,
            imageId: card.imageId ?? null,
            order: card.order ?? existingCount + index,
            isBlurred: card.isBlurred ?? false,
            difficulty: card.difficulty ?? 'MEDIUM',
            userId,
          },
        })
      )
    );
  });

  await logActivity(userId, 'CREATED_CARD', dto.setId);

  return cards;
}

export async function listCardsBySet(userId: string, setId: string) {
  const set = await prisma.set.findFirst({ where: { id: setId } });
  if (!set) throw new NotFoundError('Set not found');

  if (set.userId !== userId) {
    if (set.visibility === 'PRIVATE') {
      throw new NotFoundError('Set not found');
    }
    if (set.visibility === 'FRIENDS') {
      const friendship = await prisma.friendship.findFirst({
        where: { userId, friendId: set.userId },
      });
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
  await verifyCardOwnership(cardId, userId);

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(dto.question !== undefined && { question: dto.question }),
      ...(dto.answer !== undefined && { answer: dto.answer }),
      ...(dto.imageId !== undefined && { imageId: dto.imageId }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.isBlurred !== undefined && { isBlurred: dto.isBlurred }),
      ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
    },
  });

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

  await logActivity(userId, 'CREATED_CARD', copy.setId);

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

export async function recordStudyResult(userId: string, cardId: string, dto: StudyCardDtoType) {
  const card = await verifyCardOwnership(cardId, userId);

  const nextReviewAt = calculateNextReviewAt(dto.difficulty);

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      difficulty: dto.difficulty,
      lastStudiedAt: new Date(),
      nextReviewAt,
    },
  });

  await logActivity(userId, 'STUDIED_CARDS', card.setId);

  return updated;
}
