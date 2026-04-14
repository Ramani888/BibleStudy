import { prisma } from '../../config/db';

export async function listNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

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
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  await prisma.notification.delete({ where: { id: notificationId } });

  return { message: 'Notification deleted' };
}
