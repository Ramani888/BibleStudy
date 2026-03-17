import { apiGet, apiPost } from './client';
import { storage } from '../utils/storage';
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '../types';
import type { User } from '../types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiPost<{ message: string }>('/auth/register', payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    apiPost<AuthTokens & { user: User }>('/auth/verify-email', payload),

  resendVerification: (payload: ResendVerificationPayload) =>
    apiPost<{ message: string }>('/auth/resend-verification', payload),

  login: (payload: LoginPayload) =>
    apiPost<AuthTokens & { user: User }>('/auth/login', payload),

  refresh: (payload: RefreshPayload) =>
    apiPost<{ accessToken: string }>('/auth/refresh', payload),

  logout: async () => {
    const refreshToken = await storage.getRefreshToken();
    return apiPost<void>('/auth/logout', { refreshToken });
  },

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiPost<{ message: string }>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiPost<{ message: string }>('/auth/reset-password', payload),

  me: () =>
    apiGet<User>('/auth/me'),
};
