import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { memberHasGroupPlanAccess } from '../../utils/planAccess';
import { CreateSetDtoType, UpdateSetDtoType } from './sets.dto';
import { NotFoundError } from '../../utils/errors';

export async function createSet(userId: string, dto: CreateSetDtoType) {
  if (dto.folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: dto.folderId, userId } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
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
      color: dto.color ?? null,
    },
  });

  await logActivity(userId, 'CREATED_SET', set.id);

  return set;
}

export async function listSets(userId: string, folderId?: string) {
  if (folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) throw new NotFoundError('Folder not found');
  }

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
    where: { id: setId },
    include: {
      cards: { orderBy: { order: 'asc' } },
      folder: { select: { id: true, name: true } },
      _count: { select: { cards: true } },
    },
  });

  if (!set) {
    throw new NotFoundError('Set not found');
  }

  // Owner always; otherwise allow members studying this set via a group plan (D2).
  if (set.userId !== userId && !(await memberHasGroupPlanAccess(userId, setId))) {
    throw new NotFoundError('Set not found');
  }

  return set;
}

export async function updateSet(userId: string, setId: string, dto: UpdateSetDtoType) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) {
    throw new NotFoundError('Set not found');
  }

  if (dto.folderId) {
    const folder = await prisma.folder.findFirst({ where: { id: dto.folderId, userId } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
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
      ...(dto.color !== undefined && { color: dto.color }),
    },
  });

  return updated;
}

export async function deleteSet(userId: string, setId: string) {
  const set = await prisma.set.findFirst({ where: { id: setId, userId } });
  if (!set) {
    throw new NotFoundError('Set not found');
  }

  await prisma.set.deleteMany({ where: { id: setId, userId } });

  return { message: 'Set deleted successfully' };
}

export async function getPublicSets(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;
  const where = {
    visibility: 'PUBLIC' as const,
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  };

  const [sets, total] = await Promise.all([
    prisma.set.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.set.count({ where }),
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

export async function getFriendsSets(userId: string, page = 1, limit = 20) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);

  if (friendIds.length === 0) {
    return { sets: [], pagination: { total: 0, page, limit, pages: 0 } };
  }

  const skip = (page - 1) * limit;
  const where = { userId: { in: friendIds }, visibility: 'FRIENDS' as const };

  const [sets, total] = await Promise.all([
    prisma.set.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.set.count({ where }),
  ]);

  return {
    sets,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function cloneSet(userId: string, setId: string) {
  const originalSet = await prisma.set.findFirst({
    where: { id: setId },
    include: { cards: true },
  });

  if (!originalSet) {
    throw new NotFoundError('Set not found');
  }

  if (originalSet.userId !== userId) {
    if (originalSet.visibility === 'PRIVATE') {
      throw new NotFoundError('Set not found');
    }
    if (originalSet.visibility === 'FRIENDS') {
      const friendship = await prisma.friendship.findFirst({
        where: { userId, friendId: originalSet.userId },
      });
      if (!friendship) throw new NotFoundError('Set not found');
    }
    // PUBLIC: accessible to all authenticated users
  }

  const clonedSet = await prisma.set.create({
    data: {
      title: `${originalSet.title} (Copy)`,
      description: originalSet.description,
      userId,
      visibility: 'PRIVATE',
      layout: originalSet.layout,
      color: originalSet.color,
      folderId: originalSet.userId === userId ? originalSet.folderId : null,
      cards: {
        create: originalSet.cards.map((card) => ({
          question: card.question,
          answer: card.answer,
          note: card.note,
          imageId: card.imageId,
          order: card.order,
          difficulty: card.difficulty,
          isBlurred: card.isBlurred,
          userId,
        })),
      },
    },
    include: {
      cards: true,
      _count: { select: { cards: true } },
    },
  });

  await logActivity(userId, 'CREATED_SET', clonedSet.id);

  return clonedSet;
}
