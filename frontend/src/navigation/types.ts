import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

// ─── Library Stack (nested inside Library tab) ────────────────────────────────
export type LibraryStackParamList = {
  Library: undefined;
  FolderDetail: { folderId: string; folderName: string };
  SetDetail: { setId: string; setTitle: string };
  CreateSet: { folderId?: string };
  EditSet: { setId: string };
  CreateCard: { setId: string };
  EditCard: { cardId: string; setId: string };
  PublicSets: undefined;
  Study: { setId: string; setTitle: string };
};

// ─── AI Stack ─────────────────────────────────────────────────────────────────
export type AIStackParamList = {
  AIChat: undefined;
  ChatHistory: undefined;
};

// ─── Profile Stack ────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Credits: undefined;
  Settings: undefined;
  // Friends
  Friends: undefined;
  FriendRequests: undefined;
  SearchUsers: undefined;
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  // Groups
  Groups: undefined;
  GroupDetail: { groupId: string };
  CreateGroup: undefined;
  EditGroup: { groupId: string };
  JoinGroup: undefined;
  // Public groups
  PublicGroups: undefined;
  // Notifications
  Notifications: undefined;
};

// ─── Map Stack ────────────────────────────────────────────────────────────────
export type MapStackParamList = {
  Map: undefined;
  GatheringDetail: { gatheringId: string };
  CreateGathering: { groupId?: string };
  EditGathering: { gatheringId: string };
};

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
export type AppTabParamList = {
  HomeTab: undefined;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList> | undefined;
  MapTab: NavigatorScreenParams<MapStackParamList> | undefined;
  AITab: undefined;
  ProfileTab: undefined;
};

// ─── Convenience screen prop types ───────────────────────────────────────────
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type LibraryScreenProps<T extends keyof LibraryStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<LibraryStackParamList, T>,
    BottomTabScreenProps<AppTabParamList>
  >;

export type AIScreenProps<T extends keyof AIStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AIStackParamList, T>,
    BottomTabScreenProps<AppTabParamList>
  >;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    BottomTabScreenProps<AppTabParamList>
  >;

export type MapScreenProps<T extends keyof MapStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<MapStackParamList, T>,
    BottomTabScreenProps<AppTabParamList>
  >;
