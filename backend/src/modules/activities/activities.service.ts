import { prisma } from '../../config/db';

const userSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

export async function getMyFeed(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 50);

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.activity.count({ where: { userId } }),
  ]);

  return { activities, pagination: { total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) } };
}

export async function getFriendsFeed(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, 50);

  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);

  if (!friendIds.length) {
    return { activities: [], pagination: { total: 0, page, limit: safeLimit, pages: 0 } };
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.activity.count({ where: { userId: { in: friendIds } } }),
  ]);

  return { activities, pagination: { total, page, limit: safeLimit, pages: Math.ceil(total / safeLimit) } };
}
