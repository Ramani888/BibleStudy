import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

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
};

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────
export type AppTabParamList = {
  HomeTab: undefined;
  LibraryTab: undefined;
  StudyTab: { setId: string; setTitle: string } | undefined;
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
