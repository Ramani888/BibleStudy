import { z } from 'zod';

export const UpdateProfileDto = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  church: z.string().max(200).optional(),
  profileImage: z.string().url().optional(),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type ChangePasswordDtoType = z.infer<typeof ChangePasswordDto>;
