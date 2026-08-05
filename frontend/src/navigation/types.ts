import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { ChatSession, QuizSelectableMode } from '../types';

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
  FolderDetail: { folderId: string; folderName: string; folderColor?: string | null };
  SetDetail: { setId: string; setTitle: string; isOwner?: boolean };
  CreateSet: { folderId?: string };
  EditSet: { setId: string };
  CreateCard: { setId: string };
  EditCard: { cardId: string; setId: string };
  PublicSets: undefined;
  FriendsSets: undefined;
  QuizModePicker: { setId: string; setTitle: string; isOwner?: boolean };
  Quiz: { setId: string; setTitle: string; mode?: QuizSelectableMode; isOwner?: boolean };
};

// ─── Quiz Stack (nested inside Quiz tab) ──────────────────────────────────────
export type QuizStackParamList = {
  QuizHub: undefined;
  QuizModePicker: { setId: string; setTitle: string; isOwner?: boolean };
  Quiz: { setId: string; setTitle: string; mode?: QuizSelectableMode; isOwner?: boolean };
};

// ─── AI Stack ─────────────────────────────────────────────────────────────────
export type AIStackParamList = {
  // Pass an existing session to pre-populate and continue that conversation.
  // Pass autoSend to open the screen and immediately send a pre-formed question.
  // Omit or pass undefined to start a fresh conversation.
  AIChat: { session?: ChatSession; autoSend?: string } | undefined;
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
  // Notes
  Notes: undefined;
  NoteEditor: { noteId?: string };
  // Media
  Media: undefined;
  MediaPDFViewer: { url: string; name: string };
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
  QuizTab: NavigatorScreenParams<QuizStackParamList> | undefined;
  AITab: NavigatorScreenParams<AIStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
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

export type QuizScreenProps<T extends keyof QuizStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<QuizStackParamList, T>,
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
