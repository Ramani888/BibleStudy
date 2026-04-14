export type Plan = 'FREE' | 'STARTER' | 'PRO';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  church: string | null;
  creditBalance: number;
  storageUsed: number;
  storageLimit: number;
  plan: Plan;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  church?: string;
  profileImage?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  church: string | null;
  createdAt: string;
  isFriend: boolean;
  pendingRequest: { id: string; direction: 'incoming' | 'outgoing' } | null;
  mutualFriendsCount: number;
}
