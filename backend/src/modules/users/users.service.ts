import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { UpdateProfileDtoType, ChangePasswordDtoType } from './users.dto';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import { deleteUserFilesFromDisk } from '../media/media.service';

const PROFILE_SELECT = {
  id: true, name: true, email: true, password: true, profileImage: true,
  bio: true, church: true, creditBalance: true, storageUsed: true,
  storageLimit: true, plan: true, emailVerified: true, useFsrs: true, createdAt: true, updatedAt: true,
} as const;

function toProfileOut<T extends { password: string | null }>(user: T) {
  const { password, ...rest } = user;
  return { ...rest, hasPassword: password !== null };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
  if (!user) throw new NotFoundError('User not found');
  return toProfileOut(user);
}

export async function updateProfile(userId: string, dto: UpdateProfileDtoType) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.church !== undefined && { church: dto.church }),
      ...(dto.profileImage !== undefined && { profileImage: dto.profileImage }),
      ...(dto.useFsrs !== undefined && { useFsrs: dto.useFsrs }),
    },
    select: PROFILE_SELECT,
  });
  return toProfileOut(user);
}

export async function changePassword(userId: string, dto: ChangePasswordDtoType) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');

  if (!user.password) {
    // OAuth-only account (Google/Apple): enrolling a FIRST password must prove email ownership,
    // not ride on a (possibly stolen) access token — otherwise a short-lived stolen token becomes a
    // permanent password credential. Route through the OTP-verified reset flow, which already
    // supports OAuth accounts (auth.service.resetPassword).
    throw new UnauthorizedError('To set a password, use "Forgot password" so we can verify your email first.');
  }
  if (!dto.currentPassword) throw new UnauthorizedError('Current password is required');
  const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!isPasswordValid) throw new UnauthorizedError('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
  // Change credentials and revoke sessions atomically — a partial commit would leave old refresh
  // tokens valid against the new password.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);

  return { message: 'Password changed successfully' };
}

export async function deleteAccount(userId: string) {
  // 1) Remove disk bytes first. A disk error PROPAGATES here (user + rows still intact → the whole
  //    deletion is retryable), so we never delete the account while its files stay on public /uploads.
  await deleteUserFilesFromDisk(userId);
  // 2) Delete the user. From here the MediaFile.userId FK blocks any new upload from committing its
  //    row — an in-flight upload FK-fails and its own catch unlinks the file it wrote (media.service).
  await prisma.user.delete({ where: { id: userId } });
  // 3) Sweep once more: an upload that committed in the tiny window between (1) and (2) had its row
  //    cascade-deleted but left its file on disk. This second removal catches it (no lock needed).
  //    Best-effort — the user is gone so it can't be retried via rows; flag if it fails.
  await deleteUserFilesFromDisk(userId).catch(err =>
    console.error(`[FILE-RECONCILE] fn=deleteAccount userId=${userId} residualFileSweepFailed — check uploads/users/${userId}`, err),
  );
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
  if (block) throw new NotFoundError('User not found');

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
  if (!user) throw new NotFoundError('User not found');

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
