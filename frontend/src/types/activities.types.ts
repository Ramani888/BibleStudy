import type { UserProfile } from './friends.types';

export type ActivityType =
  | 'ADDED_FRIEND'
  | 'JOINED_GROUP'
  | 'JOINED_GATHERING'
  | 'CREATED_SET'
  | 'STUDIED_CARDS'
  | 'CREATED_NOTE';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  referenceId: string | null;
  createdAt: string;
  user: UserProfile;
}

export interface ActivityFeedResponse {
  activities: Activity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
