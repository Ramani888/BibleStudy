import type { UserProfile } from './friends.types';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  _count?: { members: number; gatherings: number };
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: UserProfile;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
}

export type UpdateGroupPayload = Partial<CreateGroupPayload>;
