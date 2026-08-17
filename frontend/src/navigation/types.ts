import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { QuizSelectableMode } from '../types';

// ─── Root Stack (above tabs — full-screen overlays) ───────────────────────────
export type RootStackParamList = {
  App: undefined;
  Quiz: { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode; retakeAttemptId?: string; quizName?: string };
  QuizSummary: { items: import('../types').SummaryItem[]; title: string; scorePct: number; total: number; correct: number; exitToHub?: boolean };
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
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
  AIConsent: undefined;
  // The active conversation lives in the AI chat store (survives navigation).
  // Pass autoSend to open the screen and immediately send a pre-formed question.
  AIChat: { autoSend?: string } | undefined;
  ChatHistory: undefined;
};

// ─── Profile Stack ────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Credits: undefined;
  Paywall: undefined;
  Achievements: undefined;
  Settings: undefined;
  // Friends
  Friends: undefined;
  Leaderboard: undefined;
  FriendRequests: undefined;
  SearchUsers: undefined;
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  // Notifications
  Notifications: { from?: 'Home' } | undefined;
  NotificationSettings: undefined;
  // Notes
  Notes: undefined;
  NoteEditor: { noteId?: string };
  // Media
  Media: undefined;
  MediaPDFViewer: { url: string; name: string };
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

