import { z } from 'zod';

export const RegisterDto = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const VerifyEmailDto = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const LogoutDto = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ResendVerificationDto = z.object({
  email: z.string().email('Invalid email address'),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordDto = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const GoogleAuthDto = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const AppleAuthDto = z.object({
  identityToken: z.string().min(1, 'Apple identity token is required'),
  nonce:         z.string().min(1, 'Nonce is required'),
  fullName: z.object({
    givenName:  z.string().nullable().optional(),
    familyName: z.string().nullable().optional(),
  }).optional(),
  email: z.string().email().nullable().optional(),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type VerifyEmailDtoType = z.infer<typeof VerifyEmailDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type RefreshDtoType = z.infer<typeof RefreshDto>;
export type LogoutDtoType = z.infer<typeof LogoutDto>;
export type ResendVerificationDtoType = z.infer<typeof ResendVerificationDto>;
export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>;
export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
export type GoogleAuthDtoType = z.infer<typeof GoogleAuthDto>;
export type AppleAuthDtoType  = z.infer<typeof AppleAuthDto>;
