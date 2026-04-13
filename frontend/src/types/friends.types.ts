export interface UserProfile {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  church: string | null;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend: UserProfile;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
  blocked: UserProfile;
}
