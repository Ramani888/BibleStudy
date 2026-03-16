import { apiGet, apiPost } from './client';
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from '../types';
import type { User } from '../types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiPost<{ message: string }>('/auth/register', payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    apiPost<AuthTokens>('/auth/verify-email', payload),

  login: (payload: LoginPayload) =>
    apiPost<AuthTokens>('/auth/login', payload),

  refresh: (payload: RefreshPayload) =>
    apiPost<AuthTokens>('/auth/refresh', payload),

  logout: () =>
    apiPost<void>('/auth/logout'),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    apiPost<{ message: string }>('/auth/forgot-password', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    apiPost<{ message: string }>('/auth/reset-password', payload),

  me: () =>
    apiGet<User>('/auth/me'),
};
