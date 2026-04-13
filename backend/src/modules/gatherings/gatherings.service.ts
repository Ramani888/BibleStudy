import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';
import { CreateGatheringDtoType, UpdateGatheringDtoType, RsvpDtoType } from './gatherings.dto';

const hostSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function createGathering(userId: string, dto: CreateGatheringDtoType) {
  // Verify group membership if groupId provided
  if (dto.groupId) {
    const member = await prisma.groupMember.findFirst({ where: { groupId: dto.groupId, userId } });
    if (!member) throw new Error('Not a member of the specified group');
  }

  const gathering = await prisma.$transaction(async (tx) => {
    const g = await tx.gathering.create({
      data: {
        title:        dto.title,
        description:  dto.description ?? null,
        date:         new Date(dto.date),
        hostId:       userId,
        groupId:      dto.groupId ?? null,
        locationName: dto.locationName ?? null,
        locationLat:  dto.locationLat ?? null,
        locationLng:  dto.locationLng ?? null,
        meetingLink:  dto.meetingLink ?? null,
        visibility:   dto.visibility ?? 'FRIENDS',
      },
    });
    // Auto-RSVP host as GOING
    await tx.gatheringParticipant.create({
      data: { gatheringId: g.id, userId, status: 'GOING' },
    });
    return g;
  });

  await logActivity(userId, 'JOINED_GATHERING', gathering.id);

  // Notify group members if associated with a group
  if (dto.groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId: dto.groupId, userId: { not: userId } },
      select: { userId: true },
    });
    const dateStr = new Date(dto.date).toLocaleDateString();
    await Promise.allSettled(
      members.map(m =>
        sendPushToUser(m.userId, 'New Gathering', `${dto.title} — ${dateStr}`, {
          type: 'gathering',
          id: gathering.id,
        })
      )
    );
  }

  // Re-fetch with full relations so the frontend gets host, participants, _count
  return prisma.gathering.findUniqueOrThrow({
    where: { id: gathering.id },
    include: {
      host: { select: hostSelect },
      participants: { include: { user: { select: hostSelect } }, orderBy: { joinedAt: 'asc' } },
      _count: { select: { participants: true } },
    },
  });
}

export async function listGatherings(
  userId: string,
  params: { groupId?: string; upcoming?: boolean; page?: number; limit?: number }
) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    OR: [
      { hostId: userId },
      { participants: { some: { userId } } },
      { visibility: 'PUBLIC' },
      {
        visibility: 'FRIENDS',
        host: {
          friendOf: { some: { userId } },
        },
      },
    ],
  };

  if (params.groupId) {
    Object.assign(where, { groupId: params.groupId });
  }
  if (params.upcoming) {
    Object.assign(where, { date: { gte: new Date() } });
  }

  const [gatherings, total] = await Promise.all([
    prisma.gathering.findMany({
      where,
      include: {
        host: { select: hostSelect },
        _count: { select: { participants: true } },
      },
      orderBy: { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.gathering.count({ where }),
  ]);

  return { gatherings, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

export async function getNearby(lat: number, lng: number, radiusKm = 50) {
  const gatherings = await prisma.gathering.findMany({
    where: {
      locationLat: { not: null },
      locationLng: { not: null },
      date: { gte: new Date() },
    },
    include: {
      host: { select: hostSelect },
      _count: { select: { participants: true } },
    },
    orderBy: { date: 'asc' },
  });

  return gatherings.filter(
    g => g.locationLat != null && g.locationLng != null &&
      haversineKm(lat, lng, g.locationLat, g.locationLng) <= radiusKm
  );
}

export async function getGathering(userId: string, gatheringId: string) {
  const gathering = await prisma.gathering.findUnique({
    where: { id: gatheringId },
    include: {
      host: { select: hostSelect },
      participants: {
        include: { user: { select: hostSelect } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { participants: true } },
    },
  });

  if (!gathering) throw new Error('Gathering not found');
  return gathering;
}

export async function updateGathering(userId: string, gatheringId: string, dto: UpdateGatheringDtoType) {
  const gathering = await prisma.gathering.findFirst({ where: { id: gatheringId, hostId: userId } });
  if (!gathering) throw new Error('Gathering not found or not authorized');

  return prisma.gathering.update({
    where: { id: gatheringId },
    data: {
      ...(dto.title        !== undefined && { title:        dto.title }),
      ...(dto.description  !== undefined && { description:  dto.description }),
      ...(dto.date         !== undefined && { date:         new Date(dto.date) }),
      ...(dto.locationName !== undefined && { locationName: dto.locationName }),
      ...(dto.locationLat  !== undefined && { locationLat:  dto.locationLat }),
      ...(dto.locationLng  !== undefined && { locationLng:  dto.locationLng }),
      ...(dto.meetingLink  !== undefined && { meetingLink:  dto.meetingLink }),
      ...(dto.visibility   !== undefined && { visibility:   dto.visibility }),
    },
    include: {
      host: { select: hostSelect },
      participants: { include: { user: { select: hostSelect } }, orderBy: { joinedAt: 'asc' } },
      _count: { select: { participants: true } },
    },
  });
}

export async function cancelGathering(userId: string, gatheringId: string) {
  const gathering = await prisma.gathering.findFirst({ where: { id: gatheringId, hostId: userId } });
  if (!gathering) throw new Error('Gathering not found or not authorized');

  // Fetch participants before deleting so we can notify them
  const participants = await prisma.gatheringParticipant.findMany({
    where: { gatheringId, userId: { not: userId } },
    select: { userId: true },
  });

  await prisma.gathering.delete({ where: { id: gatheringId } });

  // Notify all participants that the gathering was cancelled
  await Promise.allSettled(
    participants.map(p =>
      sendPushToUser(p.userId, 'Gathering Cancelled', `"${gathering.title}" has been cancelled by the host`)
    )
  );

  return { message: 'Gathering cancelled' };
}

export async function rsvp(userId: string, gatheringId: string, dto: RsvpDtoType) {
  const gathering = await prisma.gathering.findUnique({ where: { id: gatheringId } });
  if (!gathering) throw new Error('Gathering not found');

  const existing = await prisma.gatheringParticipant.findFirst({ where: { gatheringId, userId } });

  await prisma.gatheringParticipant.upsert({
    where: { gatheringId_userId: { gatheringId, userId } },
    create: { gatheringId, userId, status: dto.status },
    update: { status: dto.status },
  });

  if (!existing) {
    await logActivity(userId, 'JOINED_GATHERING', gatheringId);

    // Notify host
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    await sendPushToUser(gathering.hostId, 'New RSVP', `${user?.name} is going to ${gathering.title}`, {
      type: 'gathering_rsvp',
      id: gatheringId,
    });
  }

  return { message: 'RSVP updated' };
}

export async function leaveGathering(userId: string, gatheringId: string) {
  const gathering = await prisma.gathering.findUnique({ where: { id: gatheringId } });
  if (!gathering) throw new Error('Gathering not found');
  if (gathering.hostId === userId) throw new Error('Host cannot leave — cancel the gathering instead');

  const participant = await prisma.gatheringParticipant.findFirst({ where: { gatheringId, userId } });
  if (!participant) throw new Error('Not a participant');

  await prisma.gatheringParticipant.delete({ where: { gatheringId_userId: { gatheringId, userId } } });
  return { message: 'Left gathering' };
}

export async function listParticipants(gatheringId: string) {
  const gathering = await prisma.gathering.findUnique({ where: { id: gatheringId } });
  if (!gathering) throw new Error('Gathering not found');

  return prisma.gatheringParticipant.findMany({
    where: { gatheringId },
    include: { user: { select: hostSelect } },
    orderBy: { joinedAt: 'asc' },
  });
}
