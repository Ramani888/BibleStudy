import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';

const friendSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    include: { friend: { select: friendSelect } },
    orderBy: { createdAt: 'desc' },
  });
  return friendships;
}

export async function listRequests(userId: string, type: 'incoming' | 'outgoing') {
  if (type === 'incoming') {
    return prisma.friendRequest.findMany({
      where: { receiverId: userId, status: 'PENDING' },
      include: { sender: { select: friendSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }
  return prisma.friendRequest.findMany({
    where: { senderId: userId, status: 'PENDING' },
    include: { receiver: { select: friendSelect } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function sendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    throw new ValidationError('Cannot send friend request to yourself');
  }

  // Check target user exists
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new NotFoundError('User not found');

  // Check not blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    },
  });
  if (blocked) throw new ValidationError('Cannot send friend request');

  // Check not already friends
  const existing = await prisma.friendship.findFirst({
    where: { userId: senderId, friendId: receiverId },
  });
  if (existing) throw new ConflictError('Already friends');

  // Check no pending request either direction
  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: 'PENDING' },
        { senderId: receiverId, receiverId: senderId, status: 'PENDING' },
      ],
    },
  });
  if (pendingRequest) throw new ConflictError('Friend request already pending');

  const request = await prisma.friendRequest.upsert({
    where: { senderId_receiverId: { senderId, receiverId } },
    create: { senderId, receiverId },
    update: { status: 'PENDING', updatedAt: new Date() },
    include: { sender: { select: friendSelect }, receiver: { select: friendSelect } },
  });

  // Notify receiver
  await sendPushToUser(receiverId, 'New Friend Request', `${request.sender?.name} wants to be your friend`, {
    type: 'friend_request',
    id: request.id,
  });

  return request;
}

export async function acceptRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId, status: 'PENDING' },
    include: { sender: { select: friendSelect } },
  });
  if (!request) throw new NotFoundError('Friend request not found');

  await prisma.$transaction([
    prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } }),
    prisma.friendship.create({ data: { userId, friendId: request.senderId } }),
    prisma.friendship.create({ data: { userId: request.senderId, friendId: userId } }),
  ]);

  // Log activity for both users
  await logActivity(userId, 'ADDED_FRIEND', request.senderId);
  await logActivity(request.senderId, 'ADDED_FRIEND', userId);

  // Notify the original sender
  const receiver = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  await sendPushToUser(request.senderId, 'Friend Request Accepted', `${receiver?.name} accepted your friend request`, {
    type: 'friend_accepted',
    id: userId,
  });

  return { message: 'Friend request accepted' };
}

export async function cancelRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: { id: requestId, senderId: userId, status: 'PENDING' },
  });
  if (!request) throw new NotFoundError('Friend request not found');

  await prisma.friendRequest.delete({ where: { id: requestId } });
  return { message: 'Friend request cancelled' };
}

export async function rejectRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId, status: 'PENDING' },
  });
  if (!request) throw new NotFoundError('Friend request not found');

  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
  return { message: 'Friend request rejected' };
}

export async function removeFriend(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: { userId, friendId },
  });
  if (!friendship) throw new NotFoundError('Friend not found');

  await prisma.$transaction([
    prisma.friendship.deleteMany({ where: { userId, friendId } }),
    prisma.friendship.deleteMany({ where: { userId: friendId, friendId: userId } }),
  ]);

  return { message: 'Friend removed' };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new ValidationError('Cannot block yourself');

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new NotFoundError('User not found');

  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    }),
    prisma.friendship.deleteMany({
      where: { OR: [{ userId: blockerId, friendId: blockedId }, { userId: blockedId, friendId: blockerId }] },
    }),
    prisma.friendRequest.updateMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId, status: 'PENDING' },
          { senderId: blockedId, receiverId: blockerId, status: 'PENDING' },
        ],
      },
      data: { status: 'REJECTED' },
    }),
  ]);

  return { message: 'User blocked' };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const block = await prisma.block.findFirst({ where: { blockerId, blockedId } });
  if (!block) throw new NotFoundError('Block not found');

  await prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } });
  return { message: 'User unblocked' };
}

export async function listBlocked(userId: string) {
  return prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: friendSelect } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchUsers(userId: string, query: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  // Get blocked user IDs (both directions)
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = blocks.map(b => (b.blockerId === userId ? b.blockedId : b.blockerId));
  const excludeIds = [userId, ...blockedIds];

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      name: { contains: query, mode: 'insensitive' },
    },
    select: friendSelect,
    skip,
    take: limit,
    orderBy: { name: 'asc' },
  });

  if (users.length === 0) return [];

  const userIds = users.map(u => u.id);

  const [friendships, pendingRequests] = await Promise.all([
    prisma.friendship.findMany({
      where: { userId, friendId: { in: userIds } },
      select: { friendId: true },
    }),
    prisma.friendRequest.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { senderId: userId, receiverId: { in: userIds } },
          { senderId: { in: userIds }, receiverId: userId },
        ],
      },
      select: { id: true, senderId: true, receiverId: true },
    }),
  ]);

  const friendSet = new Set(friendships.map(f => f.friendId));
  const requestMap = new Map(
    pendingRequests.map(r => [
      r.senderId === userId ? r.receiverId : r.senderId,
      {
        id: r.id,
        direction: (r.senderId === userId ? 'outgoing' : 'incoming') as 'outgoing' | 'incoming',
      },
    ])
  );

  return users.map(u => ({
    ...u,
    isFriend: friendSet.has(u.id),
    pendingRequest: requestMap.get(u.id) ?? null,
  }));
}
