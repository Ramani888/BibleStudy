import type { UserProfile } from './friends.types';

export interface Gathering {
  id: string;
  title: string;
  description: string | null;
  hostId: string;
  groupId: string | null;
  date: string;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  meetingLink: string | null;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  createdAt: string;
  updatedAt: string;
  host: UserProfile;
  participants?: GatheringParticipant[];
  _count?: { participants: number };
}

export interface GatheringParticipant {
  gatheringId: string;
  userId: string;
  status: 'GOING' | 'MAYBE' | 'NOT_GOING';
  joinedAt: string;
  user: UserProfile;
}

export interface CreateGatheringPayload {
  title: string;
  description?: string;
  date: string;
  groupId?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  meetingLink?: string;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
}

export type UpdateGatheringPayload = Partial<CreateGatheringPayload>;

export interface GatheringListResponse {
  gatherings: Gathering[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
