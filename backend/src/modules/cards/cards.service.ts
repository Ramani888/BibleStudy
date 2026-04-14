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
    throw new Error('Set not found');
  }
  return set;
}

export async function createCard(userId: string, dto: CreateCardDtoType) {
  await verifySetOwnership(userId, dto.setId);

  const card = await prisma.card.create({
    data: {
      setId: dto.setId,
      question: dto.question,
      answer: dto.answer,
      imageId: dto.imageId ?? null,
      order: dto.order ?? 0,
      isBlurred: dto.isBlurred ?? false,
      difficulty: dto.difficulty ?? 'MEDIUM',
      userId,
    },
  });

  return card;
}

export async function bulkCreateCards(userId: string, dto: BulkCreateCardsDtoType) {
  await verifySetOwnership(userId, dto.setId);

  // Get current card count for ordering
  const existingCount = await prisma.card.count({ where: { setId: dto.setId } });

  const cards = await prisma.$transaction(
    dto.cards.map((card, index) =>
      prisma.card.create({
        data: {
          setId: dto.setId,
          question: card.question,
          answer: card.answer,
          imageId: card.imageId ?? null,
          order: card.order ?? existingCount + index,
          isBlurred: card.isBlurred ?? false,
          difficulty: card.difficulty ?? 'MEDIUM',
          userId,
        },
      })
    )
  );

  return cards;
}

export async function listCardsBySet(userId: string, setId: string) {
  await verifySetOwnership(userId, setId);

  const cards = await prisma.card.findMany({
    where: { setId },
    orderBy: { order: 'asc' },
  });

  return cards;
}

export async function getCardById(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
  });

  if (!card) {
    throw new Error('Card not found');
  }

  return card;
}

export async function updateCard(userId: string, cardId: string, dto: UpdateCardDtoType) {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    throw new Error('Card not found');
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(dto.question !== undefined && { question: dto.question }),
      ...(dto.answer !== undefined && { answer: dto.answer }),
      ...(dto.imageId !== undefined && { imageId: dto.imageId }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.isBlurred !== undefined && { isBlurred: dto.isBlurred }),
      ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
    },
  });

  return updated;
}

export async function deleteCard(userId: string, cardId: string) {
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    throw new Error('Card not found');
  }

  await prisma.card.delete({ where: { id: cardId } });

  return { message: 'Card deleted successfully' };
}

export async function reorderCards(userId: string, dto: ReorderCardsDtoType) {
  // Verify all cards belong to user
  const cards = await prisma.card.findMany({
    where: { id: { in: dto.cardIds }, userId },
  });

  if (cards.length !== dto.cardIds.length) {
    throw new Error('One or more cards not found');
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
  const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    throw new Error('Card not found');
  }

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
