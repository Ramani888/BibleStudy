import { apiGet, apiPost } from './client';
import { storage } from '../utils/storage';
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResendVerificationPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
  User,
} from '../types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiPost<{ message: string }>('/auth/register', payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    apiPost<AuthTokens & { user: User }>('/auth/verify-email', payload),

  resendVerification: (payload: ResendVerificationPayload) =>
    apiPost<{ message: string }>('/auth/resend-verification', payload),

  login: (payload: LoginPayload) =>
    apiPost<AuthTokens & { user: User }>('/auth/login', payload),

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

  googleSignIn: (payload: { idToken: string }) =>
    apiPost<AuthTokens & { user: User }>('/auth/google', payload),

  appleSignIn: (payload: { identityToken: string; nonce: string; email?: string; fullName?: { givenName?: string | null; familyName?: string | null } }) =>
    apiPost<AuthTokens & { user: User }>('/auth/apple', payload),
};
