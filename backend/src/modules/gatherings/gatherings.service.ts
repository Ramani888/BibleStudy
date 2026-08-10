import { prisma } from '../../config/db';
import { logActivity } from '../../utils/activity';
import { sendPushToUser } from '../../utils/notifications';
import type { Prisma } from '@prisma/client';
import { CreateGatheringDtoType, UpdateGatheringDtoType, RsvpDtoType } from './gatherings.dto';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors';

const hostSelect = {
  id: true,
  name: true,
  profileImage: true,
  bio: true,
  church: true,
} as const;

const participantInclude = {
  participants: {
    include: { user: { select: hostSelect } },
    orderBy: { joinedAt: 'asc' as const },
  },
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
  const gathering = await prisma.$transaction(async (tx) => {
    const g = await tx.gathering.create({
      data: {
        title:        dto.title,
        description:  dto.description ?? null,
        date:         new Date(dto.date),
        hostId:       userId,
        locationName: dto.locationName ?? null,
        locationLat:  dto.locationLat ?? null,
        locationLng:  dto.locationLng ?? null,
        meetingLink:  dto.meetingLink ?? null,
        visibility:   dto.visibility ?? 'FRIENDS',
      },
    });
    await tx.gatheringParticipant.create({
      data: { gatheringId: g.id, userId, status: 'GOING' },
    });
    return g;
  });

  await logActivity(userId, 'JOINED_GATHERING', gathering.id);

  return prisma.gathering.findUniqueOrThrow({
    where: { id: gathering.id },
    include: {
      host: { select: hostSelect },
      ...participantInclude,
      _count: { select: { participants: true } },
    },
  });
}

export async function listGatherings(
  userId: string,
  params: { upcoming?: boolean; page?: number; limit?: number }
) {
  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 20, 50);
  const skip = (page - 1) * limit;

  const where: Prisma.GatheringWhereInput = {
    OR: [
      { hostId: userId },
      { participants: { some: { userId } } },
      { visibility: 'PUBLIC' },
      { visibility: 'FRIENDS', host: { friendOf: { some: { userId } } } },
    ],
  };

  if (params.upcoming) Object.assign(where, { date: { gte: new Date() } });

  const [gatherings, total] = await Promise.all([
    prisma.gathering.findMany({
      where,
      include: { host: { select: hostSelect }, _count: { select: { participants: true } } },
      orderBy: { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.gathering.count({ where }),
  ]);

  return { gatherings, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

export async function getNearby(userId: string, lat: number, lng: number, radiusKm = 50) {
  const R = 6371;
  const latDelta = (radiusKm / R) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);

  const gatherings = await prisma.gathering.findMany({
    where: {
      locationLat: { gte: lat - latDelta, lte: lat + latDelta },
      locationLng: { gte: lng - lngDelta, lte: lng + lngDelta },
      date: { gte: new Date() },
      OR: [
        { hostId: userId },
        { participants: { some: { userId } } },
        { visibility: 'PUBLIC' },
        { visibility: 'FRIENDS', host: { friendOf: { some: { userId } } } },
      ],
    },
    include: { host: { select: hostSelect }, _count: { select: { participants: true } } },
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
    include: { host: { select: hostSelect }, ...participantInclude, _count: { select: { participants: true } } },
  });

  if (!gathering) throw new NotFoundError('Gathering not found');

  const isHost = gathering.hostId === userId;
  const isParticipant = gathering.participants.some(p => p.userId === userId);
  if (!isHost && !isParticipant) {
    if (gathering.visibility === 'PRIVATE') throw new NotFoundError('Gathering not found');
    if (gathering.visibility === 'FRIENDS') {
      const friendship = await prisma.friendship.findFirst({ where: { userId, friendId: gathering.hostId } });
      if (!friendship) throw new NotFoundError('Gathering not found');
    }
  }

  return gathering;
}

export async function updateGathering(userId: string, gatheringId: string, dto: UpdateGatheringDtoType) {
  const gathering = await prisma.gathering.findFirst({ where: { id: gatheringId, hostId: userId } });
  if (!gathering) throw new NotFoundError('Gathering not found or not authorized');

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
    include: { host: { select: hostSelect }, ...participantInclude, _count: { select: { participants: true } } },
  });
}

export async function cancelGathering(userId: string, gatheringId: string) {
  const gathering = await prisma.gathering.findFirst({ where: { id: gatheringId, hostId: userId } });
  if (!gathering) throw new NotFoundError('Gathering not found or not authorized');

  const participants = await prisma.gatheringParticipant.findMany({
    where: { gatheringId, userId: { not: userId } },
    select: { userId: true },
  });

  await prisma.gathering.delete({ where: { id: gatheringId } });

  await Promise.allSettled(
    participants.map(p =>
      sendPushToUser(p.userId, 'Gathering Cancelled', `"${gathering.title}" has been cancelled by the host`)
    )
  );

  return { message: 'Gathering cancelled' };
}

export async function rsvp(userId: string, gatheringId: string, dto: RsvpDtoType) {
  const gathering = await prisma.gathering.findUnique({ where: { id: gatheringId } });
  if (!gathering) throw new NotFoundError('Gathering not found');

  const existing = await prisma.gatheringParticipant.findFirst({ where: { gatheringId, userId } });

  await prisma.gatheringParticipant.upsert({
    where: { gatheringId_userId: { gatheringId, userId } },
    create: { gatheringId, userId, status: dto.status },
    update: { status: dto.status },
  });

  if (!existing) {
    await logActivity(userId, 'JOINED_GATHERING', gatheringId);
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
  if (!gathering) throw new NotFoundError('Gathering not found');
  if (gathering.hostId === userId) throw new ValidationError('Host cannot leave — cancel the gathering instead');

  const participant = await prisma.gatheringParticipant.findFirst({ where: { gatheringId, userId } });
  if (!participant) throw new ForbiddenError('Not a participant');

  await prisma.gatheringParticipant.delete({ where: { gatheringId_userId: { gatheringId, userId } } });
  return { message: 'Left gathering' };
}

export async function listParticipants(userId: string, gatheringId: string) {
  await getGathering(userId, gatheringId);
  return prisma.gatheringParticipant.findMany({
    where: { gatheringId },
    include: { user: { select: hostSelect } },
    orderBy: { joinedAt: 'asc' },
  });
}
