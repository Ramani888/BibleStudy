import { z } from 'zod';
import i18n from '../i18n';

/** Mirrors backend password rule: min 8 chars, 1 uppercase, 1 number */
const getPasswordSchema = () =>
  z
    .string()
    .min(8, i18n.t('auth:validation.passwordMin', 'Must be at least 8 characters'))
    .regex(/[A-Z]/, i18n.t('auth:validation.passwordUppercase', 'Must contain at least one uppercase letter'))
    .regex(/[0-9]/, i18n.t('auth:validation.passwordNumber', 'Must contain at least one number'));

export const registerSchema = z.object({
  name: z.string().trim().min(2, i18n.t('auth:validation.nameMin', 'Name must be at least 2 characters')),
  email: z.string().email(i18n.t('auth:validation.emailInvalid', 'Enter a valid email')).toLowerCase().trim(),
  password: getPasswordSchema(),
});

export const loginSchema = z.object({
  email: z.string().email(i18n.t('auth:validation.emailInvalid', 'Enter a valid email')).toLowerCase().trim(),
  password: z.string().min(1, i18n.t('auth:validation.passwordRequired', 'Password is required')),
});

export const verifyEmailSchema = z.object({
  otp: z.string().length(6, i18n.t('auth:validation.otpLength', 'OTP must be 6 digits')).regex(/^\d+$/, i18n.t('auth:validation.otpNumeric', 'OTP must be numeric')),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(i18n.t('auth:validation.emailInvalid', 'Enter a valid email')).toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  otp: z.string().length(6, i18n.t('auth:validation.otpLength', 'OTP must be 6 digits')).regex(/^\d+$/, i18n.t('auth:validation.otpNumeric', 'OTP must be numeric')),
  newPassword: getPasswordSchema(),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: i18n.t('auth:validation.passwordsDoNotMatch', 'Passwords do not match'),
  path: ['confirmPassword'],
});

export const makeChangePasswordSchema = (requireCurrent: boolean) =>
  z.object({
    currentPassword: requireCurrent
      ? z.string().min(1, i18n.t('auth:validation.currentPasswordRequired', 'Current password is required'))
      : z.string().optional(),
    newPassword: getPasswordSchema(),
    confirmPassword: z.string().min(1, i18n.t('auth:validation.confirmNewPassword', 'Please confirm your new password')),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: i18n.t('auth:validation.passwordsDoNotMatch', 'Passwords do not match'),
    path: ['confirmPassword'],
  });

export const createSetSchema = z.object({
  title: z.string().trim().min(1, i18n.t('library:validation.titleRequired', 'Title is required')).max(200, i18n.t('library:validation.titleMax', 'Max 200 characters')),
  description: z.string().trim().max(1000, i18n.t('library:validation.descMax', 'Max 1000 characters')).optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof makeChangePasswordSchema>>;
export type CreateSetFormData = z.infer<typeof createSetSchema>;
