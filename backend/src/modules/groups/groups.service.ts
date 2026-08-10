import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';
import { CreateGroupDtoType, UpdateGroupDtoType, UpdateRoleDtoType, AddMemberDtoType } from './groups.dto';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../utils/errors';

const memberUserSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

async function verifyGroupAdmin(groupId: string, userId: string) {
  const member = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!member || member.role !== 'ADMIN') throw new ForbiddenError('Not authorized');
  return member;
}

/** Standard include shape so every group response is consistent */
const groupInclude = {
  members: {
    include: { user: { select: memberUserSelect } },
    orderBy: { joinedAt: 'asc' as const },
  },
  _count: { select: { members: true, gatherings: true } },
} as const;

export async function createGroup(userId: string, dto: CreateGroupDtoType) {
  const group = await prisma.$transaction(async (tx) => {
    const g = await tx.group.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        ownerId: userId,
        visibility: dto.visibility ?? 'PRIVATE',
      },
    });
    await tx.groupMember.create({
      data: { groupId: g.id, userId, role: 'ADMIN' },
    });
    return g;
  });

  await logActivity(userId, 'JOINED_GROUP', group.id);

  return prisma.group.findUniqueOrThrow({
    where: { id: group.id },
    include: groupInclude,
  });
}

export async function listMyGroups(userId: string) {
  return prisma.group.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      _count: { select: { members: true, gatherings: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getGroup(userId: string, groupId: string) {
  const member = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!member) throw new NotFoundError('Group not found');

  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: memberUserSelect } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { members: true, gatherings: true } },
    },
  });
}

export async function updateGroup(userId: string, groupId: string, dto: UpdateGroupDtoType) {
  await verifyGroupAdmin(groupId, userId);

  return prisma.group.update({
    where: { id: groupId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.visibility !== undefined && { visibility: dto.visibility }),
    },
    include: groupInclude,
  });
}

export async function deleteGroup(userId: string, groupId: string) {
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId: userId } });
  if (!group) throw new NotFoundError('Group not found or not authorized');

  await prisma.group.delete({ where: { id: groupId } });
  return { message: 'Group deleted successfully' };
}

/** Admin directly adds a user to the group */
export async function addMember(requesterId: string, groupId: string, dto: AddMemberDtoType) {
  await verifyGroupAdmin(groupId, requesterId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group not found');

  const existing = await prisma.groupMember.findFirst({ where: { groupId, userId: dto.userId } });
  if (existing) throw new ConflictError('User is already a member');

  await prisma.groupMember.create({
    data: { groupId, userId: dto.userId, role: 'MEMBER' },
  });

  await logActivity(dto.userId, 'JOINED_GROUP', groupId);

  const addedUser = await prisma.user.findUnique({ where: { id: dto.userId }, select: { name: true } });
  await sendPushToUser(dto.userId, 'Added to Group', `You were added to "${group.name}"`, {
    type: 'group',
    id: groupId,
  });

  return prisma.group.findUniqueOrThrow({ where: { id: groupId }, include: groupInclude });
}

/** Self-join for PUBLIC groups */
export async function joinPublicGroup(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group not found');
  if (group.visibility !== 'PUBLIC') throw new ForbiddenError('Group is not public');

  const existing = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (existing) throw new ConflictError('Already a member of this group');

  await prisma.groupMember.create({ data: { groupId, userId, role: 'MEMBER' } });
  await logActivity(userId, 'JOINED_GROUP', groupId);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  const admins = await prisma.groupMember.findMany({
    where: { groupId, role: 'ADMIN', userId: { not: userId } },
    select: { userId: true },
  });
  await Promise.allSettled(
    admins.map(a =>
      sendPushToUser(a.userId, 'New Member', `${user?.name} joined "${group.name}"`, { type: 'group', id: groupId })
    )
  );

  return prisma.group.findUniqueOrThrow({ where: { id: groupId }, include: groupInclude });
}

export async function leaveGroup(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError('Group not found');

  const member = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!member) throw new ForbiddenError('Not a member of this group');

  // Prevent leaving if this user is the last admin and group has other members
  if (member.role === 'ADMIN') {
    const adminCount = await prisma.groupMember.count({ where: { groupId, role: 'ADMIN' } });
    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    if (memberCount > 1 && adminCount === 1) {
      throw new ValidationError('You are the last admin — promote another member before leaving');
    }
  }

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId } } });
  return { message: 'Left group successfully' };
}

export async function updateMemberRole(
  requesterId: string,
  groupId: string,
  targetUserId: string,
  dto: UpdateRoleDtoType
) {
  await verifyGroupAdmin(groupId, requesterId);

  const target = await prisma.groupMember.findFirst({ where: { groupId, userId: targetUserId } });
  if (!target) throw new NotFoundError('Member not found');

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (group?.ownerId === targetUserId && dto.role === 'MEMBER') {
    throw new ValidationError('Cannot demote the group owner');
  }

  return prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: dto.role },
    include: { user: { select: memberUserSelect } },
  });
}

export async function removeMember(requesterId: string, groupId: string, targetUserId: string) {
  await verifyGroupAdmin(groupId, requesterId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (group?.ownerId === targetUserId) throw new ValidationError('Cannot remove the group owner');

  const target = await prisma.groupMember.findFirst({ where: { groupId, userId: targetUserId } });
  if (!target) throw new NotFoundError('Member not found');

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } });
  return { message: 'Member removed' };
}


export async function listPublicGroups(params?: { search?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 50);
  const skip = (page - 1) * limit;

  const where: Prisma.GroupWhereInput = { visibility: 'PUBLIC' };
  if (params?.search?.trim()) {
    where.name = { contains: params.search.trim(), mode: 'insensitive' };
  }

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      include: { _count: { select: { members: true, gatherings: true } } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.group.count({ where }),
  ]);

  return { groups, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

export async function notifyGroupMembers(
  groupId: string,
  excludeUserId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const members = await prisma.groupMember.findMany({
    where: { groupId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  await Promise.allSettled(
    members.map(m => sendPushToUser(m.userId, title, body, data))
  );
}
