import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { storage } from '../utils/storage';
import type { User } from '../types';
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyEmail: (payload: VerifyEmailPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  updateUser: (user: User) => void;
  setTokensAndUser: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,

  /**
   * Called once on app start — rehydrate tokens from storage
   * and fetch the current user if a valid token exists.
   */
  initialize: async () => {
    try {
      const token = await storage.getAccessToken();
      if (!token) {
        set({ isInitialized: true });
        return;
      }

      // Token exists — fetch current user to confirm it is still valid
      const user = await authApi.me();
      set({ accessToken: token, user, isAuthenticated: true, isInitialized: true });
    } catch {
      // Token expired or invalid — clear and show auth screens
      await storage.clearTokens();
      set({ isInitialized: true });
    }
  },

  register: async (payload: RegisterPayload) => {
    await authApi.register(payload);
    // After register, user must verify email — no tokens yet
  },

  verifyEmail: async (payload: VerifyEmailPayload) => {
    const tokens = await authApi.verifyEmail(payload);
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    const user = await authApi.me();
    set({ accessToken: tokens.accessToken, user, isAuthenticated: true });
  },

  login: async (payload: LoginPayload) => {
    const tokens = await authApi.login(payload);
    await storage.setTokens(tokens.accessToken, tokens.refreshToken);
    const user = await authApi.me();
    set({ accessToken: tokens.accessToken, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      await storage.clearTokens();
      get().reset();
    }
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    await authApi.forgotPassword(payload);
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    await authApi.resetPassword(payload);
  },

  updateUser: (user: User) => set({ user }),

  setTokensAndUser: async (accessToken: string, refreshToken: string, user: User) => {
    await storage.setTokens(accessToken, refreshToken);
    set({ accessToken, user, isAuthenticated: true });
  },

  reset: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
}));
