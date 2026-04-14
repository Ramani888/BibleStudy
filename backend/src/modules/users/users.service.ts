import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { UpdateProfileDtoType, ChangePasswordDtoType } from './users.dto';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      church: true,
      creditBalance: true,
      storageUsed: true,
      storageLimit: true,
      plan: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function updateProfile(userId: string, dto: UpdateProfileDtoType) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.church !== undefined && { church: dto.church }),
      ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      bio: true,
      church: true,
      creditBalance: true,
      storageUsed: true,
      storageLimit: true,
      plan: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function changePassword(userId: string, dto: ChangePasswordDtoType) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all refresh tokens after password change
  await prisma.refreshToken.deleteMany({ where: { userId } });

  return { message: 'Password changed successfully' };
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
  return { message: 'Account deleted successfully' };
}

export async function getUserById(targetId: string, requesterId: string) {
  // Check blocked in both directions
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: requesterId, blockedId: targetId },
        { blockerId: targetId, blockedId: requesterId },
      ],
    },
  });
  if (block) throw new Error('User not found');

  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      profileImage: true,
      bio: true,
      church: true,
      createdAt: true,
    },
  });
  if (!user) throw new Error('User not found');

  // Friendship status
  const friendship = await prisma.friendship.findFirst({
    where: { userId: requesterId, friendId: targetId },
  });

  // Pending request in either direction
  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { senderId: requesterId, receiverId: targetId },
        { senderId: targetId, receiverId: requesterId },
      ],
    },
  });

  // Mutual friends count
  const [requesterFriends, targetFriends] = await Promise.all([
    prisma.friendship.findMany({ where: { userId: requesterId }, select: { friendId: true } }),
    prisma.friendship.findMany({ where: { userId: targetId }, select: { friendId: true } }),
  ]);
  const requesterFriendIds = new Set(requesterFriends.map(f => f.friendId));
  const mutualFriendsCount = targetFriends.filter(f => requesterFriendIds.has(f.friendId)).length;

  return {
    ...user,
    isFriend: !!friendship,
    pendingRequest: pendingRequest
      ? { id: pendingRequest.id, direction: pendingRequest.senderId === requesterId ? 'outgoing' as const : 'incoming' as const }
      : null,
    mutualFriendsCount,
  };
}

export async function registerDeviceToken(userId: string, token: string, platform: 'IOS' | 'ANDROID') {
  await prisma.deviceToken.upsert({
    where:  { token },
    create: { userId, token, platform },
    update: { userId },
  });
  return { message: 'Device token registered' };
}

export async function removeDeviceToken(userId: string, token: string) {
  await prisma.deviceToken.deleteMany({ where: { userId, token } });
  return { message: 'Device token removed' };
}
