import { prisma } from '../../config/db';
import { NotFoundError } from '../../utils/errors';

export async function listNotifications(userId: string, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.min(Math.max(Number.isFinite(page) ? Math.floor(page) : 1, 1), 1_000_000);
  const skip = (safePage - 1) * safeLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], // id tiebreaker: createdAt isn't unique → stable paging
      skip,
      take: safeLimit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) },
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  // Ownership in the predicate: atomic (no findFirst→update-by-id race that P2025s if the row is
  // deleted in between) and IDOR-safe (can't touch another user's row).
  const { count } = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
  if (count === 0) throw new NotFoundError('Notification not found');

  return { message: 'Notification marked as read' };
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { message: 'All notifications marked as read' };
}

export async function deleteNotification(userId: string, notificationId: string) {
  // deleteMany (not delete-by-id): concurrent double-delete used to P2025→500 the loser.
  const { count } = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
  if (count === 0) throw new NotFoundError('Notification not found');

  return { message: 'Notification deleted' };
}
