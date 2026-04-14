import { LocationPrivacy } from '@prisma/client';
import { prisma } from '../../config/db';
import { getNearby } from '../gatherings/gatherings.service';
import { UpdateLocationDtoType, PrivacyDtoType } from './map.dto';

export async function updateLocation(userId: string, dto: UpdateLocationDtoType) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      locationLat:   dto.lat,
      locationLng:   dto.lng,
      locationName:  dto.locationName ?? null,
      lastLocationAt: new Date(),
    },
  });
  return { message: 'Location updated' };
}

export async function getFriendsLocations(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    select: { friendId: true },
  });
  const friendIds = friendships.map(f => f.friendId);
  if (!friendIds.length) return [];

  const friends = await prisma.user.findMany({
    where: {
      id: { in: friendIds },
      // SELECTED currently behaves as FRIENDS. Needs future SelectedLocationUser join table.
      locationPrivacy: { in: [LocationPrivacy.FRIENDS, LocationPrivacy.SELECTED, LocationPrivacy.EVERYONE] },
      locationLat: { not: null },
      locationLng: { not: null },
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      locationLat: true,
      locationLng: true,
      locationName: true,
      lastLocationAt: true,
    },
  });

  return friends;
}

export async function getNearbyGatherings(userId: string, lat: number, lng: number, radiusKm = 50) {
  return getNearby(userId, lat, lng, radiusKm);
}

export async function updatePrivacy(userId: string, dto: PrivacyDtoType) {
  await prisma.user.update({
    where: { id: userId },
    data: { locationPrivacy: dto.privacy as LocationPrivacy },
  });
  return { message: 'Privacy setting updated' };
}
