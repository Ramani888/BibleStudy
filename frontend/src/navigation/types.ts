import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { QuizSelectableMode } from '../types';

// ─── Root Stack (above tabs — full-screen overlays + cross-cutting modals) ────
export type RootStackParamList = {
  App: undefined;
  Quiz: { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode; retakeAttemptId?: string; quizName?: string };
  QuizSummary: { items: import('../types').SummaryItem[]; title: string; scorePct: number; total: number; correct: number; exitToHub?: boolean };
  // Cross-cutting modals — navigate here from any tab; back always returns to caller
  Notes: undefined;
  NoteEditor: { noteId?: string };
  Media: undefined;
  MediaPDFViewer: { url: string; name: string };
  Notifications: { from?: 'Home' } | undefined;
  Friends: undefined;
  Leaderboard: undefined;
  FriendRequests: undefined;
  SearchUsers: undefined;
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  Paywall: undefined;
  Credits: undefined;
  Achievements: undefined;
};

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
  CreateSet: { folderId?: string };
  EditSet: { setId: string };
  CreateCard: { setId: string };
  EditCard: { cardId: string; setId: string };
  StudyPlans: undefined;
  PlanDetail: { planId: string };
  CreatePlan: undefined;
  Quiz: { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode };
};

// ─── Quiz Stack (nested inside Quiz tab) ──────────────────────────────────────
export type QuizStackParamList = {
  QuizHub: undefined;
  QuizDetail: { id: string; setIds: string[]; setTitles: string[]; mode: string | null; scorePct: number; correct: number; total: number; createdAt: string; practicedAt?: string; quizName?: string; timeSecs?: number };
  QuizSetup: { preSelectedSetIds?: string[]; preSelectedSetTitles?: string[]; retakeAttemptId?: string } | undefined;
  Quiz: { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode; retakeAttemptId?: string; quizName?: string };
};

// ─── AI Stack ─────────────────────────────────────────────────────────────────
export type AIStackParamList = {
  // The active conversation lives in the AI chat store (survives navigation).
  // Pass autoSend to open the screen and immediately send a pre-formed question.
  AIChat: { autoSend?: string } | undefined;
  ChatHistory: undefined;
};

// ─── Profile Stack (profile-specific settings screens only) ──────────────────
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
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

// Root modal screens (cross-cutting — navigable from any tab)
export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type LibraryScreenProps<T extends keyof LibraryStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<LibraryStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type AIScreenProps<T extends keyof AIStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AIStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type QuizScreenProps<T extends keyof QuizStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<QuizStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    CompositeScreenProps<
      BottomTabScreenProps<AppTabParamList>,
      NativeStackScreenProps<RootStackParamList>
    >
  >;
