import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { CreateSetDtoType, UpdateSetDtoType } from './sets.dto';

export async function createSet(userId: string, dto: CreateSetDtoType) {
  if (dto.folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: dto.folderId, userId } });
    if (!folder) {
      throw new Error('Folder not found');
    }
  }

  const set = await prisma.set.create({
    data: {
      title: dto.title,
      description: dto.description ?? null,
      folderId: dto.folderId ?? null,
      userId,
      visibility: dto.visibility ?? 'PRIVATE',
      layout: dto.layout ?? 'DEFAULT',
    },
  });

  await logActivity(userId, 'CREATED_SET', set.id);

  return set;
}

export async function listSets(userId: string, folderId?: string) {
  const sets = await prisma.set.findMany({
    where: {
      userId,
      ...(folderId ? { folderId } : {}),
    },
    include: {
      _count: { select: { cards: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return sets;
}

export async function getSetById(userId: string, setId: string) {
  const set = await prisma.set.findFirst({
    where: { id: setId, userId },
    include: {
      cards: { orderBy: { order: 'asc' } },
      folder: { select: { id: true, name: true } },
      _count: { select: { cards: true } },
    },
  });

  if (!set) {
    throw new Error('Set not found');
  }

  return set;
}

export async function updateSet(userId: string, setId: string, dto: UpdateSetDtoType) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) {
    throw new Error('Set not found');
  }

  if (dto.folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: dto.folderId, userId } });
    if (!folder) {
      throw new Error('Folder not found');
    }
  }

  const updated = await prisma.set.update({
    where: { id: setId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.folderId !== undefined && { folderId: dto.folderId }),
      ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      ...(dto.layout !== undefined && { layout: dto.layout }),
    },
  });

  return updated;
}

export async function deleteSet(userId: string, setId: string) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) {
    throw new Error('Set not found');
  }

  await prisma.set.delete({ where: { id: setId } });

  return { message: 'Set deleted successfully' };
}

export async function getPublicSets(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [sets, total] = await Promise.all([
    prisma.set.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.set.count({ where: { visibility: 'PUBLIC' } }),
  ]);

  return {
    sets,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function cloneSet(userId: string, setId: string) {
  const originalSet = await prisma.set.findFirst({
    where: {
      id: setId,
      OR: [{ visibility: 'PUBLIC' }, { userId }],
    },
    include: { cards: true },
  });

  if (!originalSet) {
    throw new Error('Set not found');
  }

  const clonedSet = await prisma.set.create({
    data: {
      title: `${originalSet.title} (Copy)`,
      description: originalSet.description,
      userId,
      visibility: 'PRIVATE',
      layout: originalSet.layout,
      cards: {
        create: originalSet.cards.map((card) => ({
          question: card.question,
          answer: card.answer,
          imageId: card.imageId,
          order: card.order,
          difficulty: card.difficulty,
          userId,
        })),
      },
    },
    include: {
      cards: true,
      _count: { select: { cards: true } },
    },
  });

  return clonedSet;
}
