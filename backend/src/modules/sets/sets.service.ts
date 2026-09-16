import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { storeCardEmbedding } from '../ai/embeddings.service';
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
  // Scope ownership in the query itself (matches updateSet/deleteSet) rather than fetching every
  // card then checking set.userId after — no reason to pull another user's card content into memory.
  const set = await prisma.set.findFirst({
    where: { id: setId, userId },
    include: {
      cards: { orderBy: { order: 'asc' } },
      folder: { select: { id: true, name: true } },
      _count: { select: { cards: true } },
    },
  });

  if (!set) {
    throw new NotFoundError('Set not found');
  }

  return set;
}

// Public, unauthenticated view of a PUBLIC set — backs getverdance.com/s/:id share links.
// Only PUBLIC sets are resolvable; private/friends sets 404 so a leaked link exposes nothing.
export async function getSharedSet(setId: string) {
  const set = await prisma.set.findFirst({
    where: { id: setId, visibility: 'PUBLIC' },
    select: {
      id: true,
      title: true,
      description: true,
      user: { select: { name: true } },
      _count: { select: { cards: true } },
      cards: { orderBy: { order: 'asc' }, take: 6, select: { question: true, answer: true } },
    },
  });
  if (!set) throw new NotFoundError('Set not found');
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

  // Ownership-scoped write (atomic — no check-then-act on the mutation itself).
  await prisma.set.updateMany({
    where: { id: setId, userId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.folderId !== undefined && { folderId: dto.folderId }),
      ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      ...(dto.layout !== undefined && { layout: dto.layout }),
      ...(dto.color !== undefined && { color: dto.color }),
    },
  });

  return prisma.set.findFirstOrThrow({ where: { id: setId, userId } });
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

export async function getUserSets(viewerId: string, targetId: string) {
  if (viewerId === targetId) {
    return prisma.set.findMany({
      where: { userId: targetId },
      include: { _count: { select: { cards: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
  const isFriend = !!(await prisma.friendship.findFirst({ where: { userId: viewerId, friendId: targetId } }));
  const visibilities: ('PUBLIC' | 'FRIENDS')[] = isFriend ? ['PUBLIC', 'FRIENDS'] : ['PUBLIC'];
  return prisma.set.findMany({
    where: { userId: targetId, visibility: { in: visibilities } },
    include: { _count: { select: { cards: true } } },
    orderBy: { updatedAt: 'desc' },
  });
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
          type: card.type, // preserve QA vs STORY — omitting it defaulted every cloned card to QA
          question: card.question,
          answer: card.answer,
          note: card.note,
          // Keep the image only when cloning your OWN set. Copying another user's imageId would point
          // the clone at their MediaFile (a different owner's storage) — a cross-user coupling that
          // breaks when their file expires/deletes and muddies cleanup. Cross-user clones drop it.
          imageId: originalSet.userId === userId ? card.imageId : null,
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

  // Schedule embeddings for the cloned cards (fire-and-forget, like createCard/bulkCreate) — without
  // this the copies stay invisible to AI personal-library retrieval until each card is edited.
  Promise.all(clonedSet.cards.map(c => storeCardEmbedding(c.id, c.question, c.answer))).catch(() => {});

  await logActivity(userId, 'CREATED_SET', clonedSet.id);

  return clonedSet;
}
