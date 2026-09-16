import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { getStreak } from '../credits/credits.service';

const friendSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

// Serialize all friendship-state mutations (send / accept / block) for a pair of users inside one
// transaction guarded by a canonical per-pair advisory lock. Without it, accept can interleave with
// block (re-friending across a block once the block has committed) and two concurrent reciprocal
// accepts can deadlock on each other's request rows. Sorting the ids gives both directions the same
// lock key; the xact lock auto-releases on commit/rollback, so a pair's mutations run one at a time.
async function withPairLock<T>(a: string, b: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  const key = [a, b].sort().join(':');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
    return fn(tx);
  });
}

export async function listFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    include: { friend: { select: friendSelect } },
    orderBy: { createdAt: 'desc' },
  });
  return friendships;
}

// C3: friends leaderboard — you + all your friends ranked by current streak
// (tiebreak: longest streak, then name). Shows longest streak + achievements unlocked
// as secondary stats so there's something to display when streaks are low.
export async function getLeaderboard(userId: string) {
  const [me, friendships] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: friendSelect }),
    prisma.friendship.findMany({ where: { userId }, include: { friend: { select: friendSelect } } }),
  ]);
  if (!me) throw new NotFoundError('User not found');

  const people = [me, ...friendships.map(f => f.friend)];
  const ids = people.map(p => p.id);

  // Achievements unlocked per user — one grouped query for the whole board.
  const achCounts = await prisma.userAchievement.groupBy({
    by: ['userId'],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });
  const achMap = new Map(achCounts.map(a => [a.userId, a._count._all]));

  // ponytail: getStreak runs one REWARD query per person — fine for normal friend
  // counts; batch into a single grouped query if someone racks up hundreds of friends.
  const rows = await Promise.all(
    people.map(async p => {
      const { streak, longestStreak } = await getStreak(p.id);
      return {
        userId: p.id,
        name: p.name,
        profileImage: p.profileImage,
        streak,
        longestStreak,
        achievements: achMap.get(p.id) ?? 0,
        isMe: p.id === userId,
      };
    }),
  );

  rows.sort((a, b) => b.streak - a.streak || b.longestStreak - a.longestStreak || a.name.localeCompare(b.name));
  return rows;
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

  // All the block / already-friends / duplicate-pending checks and the upsert run inside the
  // pair lock so they can't interleave with a concurrent block or a reverse-direction send.
  const request = await withPairLock(senderId, receiverId, async (tx) => {
    const blocked = await tx.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (blocked) throw new ValidationError('Cannot send friend request');

    const existing = await tx.friendship.findFirst({
      where: { userId: senderId, friendId: receiverId },
    });
    if (existing) throw new ConflictError('Already friends');

    const pendingRequest = await tx.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: 'PENDING' },
          { senderId: receiverId, receiverId: senderId, status: 'PENDING' },
        ],
      },
    });
    if (pendingRequest) throw new ConflictError('Friend request already pending');

    return tx.friendRequest.upsert({
      where: { senderId_receiverId: { senderId, receiverId } },
      create: { senderId, receiverId },
      update: { status: 'PENDING', updatedAt: new Date() },
      include: { sender: { select: friendSelect }, receiver: { select: friendSelect } },
    });
  });

  // Notify receiver
  await sendPushToUser(receiverId, 'New Friend Request', `${request.sender?.name} wants to be your friend`, {
    type: 'friend_request',
    id: request.id,
  });

  return request;
}

export async function acceptRequest(userId: string, requestId: string) {
  // Discover the counterparty so we can take the canonical pair lock. This read is NOT trusted —
  // every authorization decision below is re-made on a fresh read inside the lock.
  const pre = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId },
    select: { senderId: true },
  });
  if (!pre) throw new NotFoundError('Friend request not found');
  const senderId = pre.senderId;

  const transitioned = await withPairLock(userId, senderId, async (tx) => {
    const req = await tx.friendRequest.findFirst({ where: { id: requestId, receiverId: userId } });
    if (!req) throw new NotFoundError('Friend request not found');

    // Re-check blocks inside the lock: a block that committed after the outer read (or races this
    // accept) is now visible, so we never friend across a block.
    const blocked = await tx.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: senderId },
          { blockerId: senderId, blockedId: userId },
        ],
      },
    });
    if (blocked) throw new ValidationError('Cannot accept friend request');

    if (req.status === 'ACCEPTED') {
      // Idempotent retry of a completed accept (lost response) → success no-op, no re-notify.
      const fs = await tx.friendship.findFirst({ where: { userId, friendId: senderId } });
      if (fs) return false;
      throw new NotFoundError('Friend request not found'); // accepted-then-unfriended: stale
    }
    if (req.status !== 'PENDING') throw new NotFoundError('Friend request not found'); // REJECTED, etc.

    await tx.friendRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
    // skipDuplicates keeps this idempotent: concurrent/retried accepts and a reciprocal request
    // from the sendRequest race no longer hit the Friendship unique constraint (P2002 → 500).
    await tx.friendship.createMany({
      data: [
        { userId, friendId: senderId },
        { userId: senderId, friendId: userId },
      ],
      skipDuplicates: true,
    });
    // Resolve any reverse-direction pending request so it can't strand as PENDING.
    await tx.friendRequest.updateMany({
      where: { senderId: userId, receiverId: senderId, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
    return true;
  });

  // Only the transaction that actually flipped PENDING→ACCEPTED logs activity + notifies.
  if (transitioned) {
    await logActivity(userId, 'ADDED_FRIEND', senderId);
    await logActivity(senderId, 'ADDED_FRIEND', userId);
    const receiver = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await sendPushToUser(senderId, 'Friend Request Accepted', `${receiver?.name} accepted your friend request`, {
      type: 'friend_accepted',
      id: userId,
    });
  }

  return { message: 'Friend request accepted' };
}

export async function cancelRequest(userId: string, requestId: string) {
  // Discover the pair, then re-read status inside the lock so a cancel racing an accept can't
  // delete an already-ACCEPTED request (which would strand the friendship) or 500 accept's update.
  const pre = await prisma.friendRequest.findFirst({
    where: { id: requestId, senderId: userId },
    select: { receiverId: true },
  });
  if (!pre) throw new NotFoundError('Friend request not found');

  await withPairLock(userId, pre.receiverId, async (tx) => {
    const req = await tx.friendRequest.findFirst({ where: { id: requestId, senderId: userId, status: 'PENDING' } });
    if (!req) throw new NotFoundError('Friend request not found');
    await tx.friendRequest.delete({ where: { id: requestId } });
  });
  return { message: 'Friend request cancelled' };
}

export async function rejectRequest(userId: string, requestId: string) {
  const pre = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId },
    select: { senderId: true },
  });
  if (!pre) throw new NotFoundError('Friend request not found');

  await withPairLock(userId, pre.senderId, async (tx) => {
    const req = await tx.friendRequest.findFirst({ where: { id: requestId, receiverId: userId, status: 'PENDING' } });
    if (!req) throw new NotFoundError('Friend request not found');
    await tx.friendRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
  });
  return { message: 'Friend request rejected' };
}

export async function removeFriend(userId: string, friendId: string) {
  // Same pair lock: two users removing each other concurrently used to delete the two rows in
  // opposite order and deadlock (→ 500). The canonical key serializes them.
  return withPairLock(userId, friendId, async (tx) => {
    const friendship = await tx.friendship.findFirst({ where: { userId, friendId } });
    if (!friendship) throw new NotFoundError('Friend not found');
    await tx.friendship.deleteMany({ where: { userId, friendId } });
    await tx.friendship.deleteMany({ where: { userId: friendId, friendId: userId } });
    return { message: 'Friend removed' };
  });
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new ValidationError('Cannot block yourself');

  const target = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new NotFoundError('User not found');

  // Same pair lock as accept/send: guarantees a concurrent acceptRequest either commits fully
  // before this runs (then its friendship is deleted here) or sees the block and refuses.
  return withPairLock(blockerId, blockedId, async (tx) => {
    await tx.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    await tx.friendship.deleteMany({
      where: { OR: [{ userId: blockerId, friendId: blockedId }, { userId: blockedId, friendId: blockerId }] },
    });
    await tx.friendRequest.updateMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId, status: 'PENDING' },
          { senderId: blockedId, receiverId: blockerId, status: 'PENDING' },
        ],
      },
      data: { status: 'REJECTED' },
    });
    return { message: 'User blocked' };
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  // Atomic delete-and-count: concurrent unblocks used to race findFirst→delete and 500 the loser
  // with P2025. No pair lock needed — unblock only removes the block row (last-writer-wins vs block).
  const { count } = await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  if (count === 0) throw new NotFoundError('Block not found');
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
