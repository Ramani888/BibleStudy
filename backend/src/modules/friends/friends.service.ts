import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';

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
    throw new Error('Cannot send friend request to yourself');
  }

  // Check target user exists
  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new Error('User not found');

  // Check not blocked
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    },
  });
  if (blocked) throw new Error('Cannot send friend request');

  // Check not already friends
  const existing = await prisma.friendship.findFirst({
    where: { userId: senderId, friendId: receiverId },
  });
  if (existing) throw new Error('Already friends');

  // Check no pending request either direction
  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: 'PENDING' },
        { senderId: receiverId, receiverId: senderId, status: 'PENDING' },
      ],
    },
  });
  if (pendingRequest) throw new Error('Friend request already pending');

  const request = await prisma.friendRequest.create({
    data: { senderId, receiverId },
    include: { sender: { select: friendSelect }, receiver: { select: friendSelect } },
  });

  // Notify receiver
  const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
  await sendPushToUser(receiverId, 'New Friend Request', `${sender?.name} wants to be your friend`, {
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
  if (!request) throw new Error('Friend request not found');

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

export async function rejectRequest(userId: string, requestId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId, status: 'PENDING' },
  });
  if (!request) throw new Error('Friend request not found');

  await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
  return { message: 'Friend request rejected' };
}

export async function removeFriend(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: { userId, friendId },
  });
  if (!friendship) throw new Error('Friend not found');

  await prisma.$transaction([
    prisma.friendship.deleteMany({ where: { userId, friendId } }),
    prisma.friendship.deleteMany({ where: { userId: friendId, friendId: userId } }),
  ]);

  return { message: 'Friend removed' };
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error('Cannot block yourself');

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new Error('User not found');

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
  if (!block) throw new Error('Block not found');

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

  // Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);

  const excludeIds = [...new Set([userId, ...blockedIds, ...friendIds])];

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      name: { contains: query, mode: 'insensitive' },
    },
    select: friendSelect,
    skip,
    take: limit,
  });

  return users;
}
