import { prisma } from '../../config/db';

const userSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

export async function getMyFeed(userId: string, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  // Bound page to a finite integer (NaN/Infinity/huge digit strings from parseInt would make skip
  // Infinity → Prisma 500) and cap it so the offset stays in range; 1M feed-pages is far past real use.
  const safePage = Math.min(Math.max(Number.isFinite(page) ? Math.floor(page) : 1, 1), 1_000_000);
  const skip = (safePage - 1) * safeLimit; // must use safeLimit, else limit>50 leaves unreachable rows

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId },
      include: { user: { select: userSelect } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // id tiebreaker: createdAt isn't unique, so offset paging is stable
      skip,
      take: safeLimit,
    }),
    prisma.activity.count({ where: { userId } }),
  ]);

  return { activities, pagination: { total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) } };
}

export async function getFriendsFeed(userId: string, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.min(Math.max(Number.isFinite(page) ? Math.floor(page) : 1, 1), 1_000_000);
  const skip = (safePage - 1) * safeLimit;

  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);

  if (!friendIds.length) {
    return { activities: [], pagination: { total: 0, page: safePage, limit: safeLimit, pages: 0 } };
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: userSelect } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // id tiebreaker: createdAt isn't unique, so offset paging is stable
      skip,
      take: safeLimit,
    }),
    prisma.activity.count({ where: { userId: { in: friendIds } } }),
  ]);

  return { activities, pagination: { total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) } };
}
