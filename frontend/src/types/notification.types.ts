export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'friend_request' | 'friend_accepted' | 'achievement' | 'system';
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
