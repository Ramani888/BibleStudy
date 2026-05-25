import { z } from 'zod';

export const CreateFolderDto = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(200),
  parentId: z.string().uuid().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

export const UpdateFolderDto = z.object({
  name: z.string().trim().min(1, 'Folder name is required').max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').nullable().optional(),
});

export type CreateFolderDtoType = z.infer<typeof CreateFolderDto>;
export type UpdateFolderDtoType = z.infer<typeof UpdateFolderDto>;
