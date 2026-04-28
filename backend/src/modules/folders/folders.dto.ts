import { z } from 'zod';

export const CreateFolderDto = z.object({
  name: z.string().min(1, 'Folder name is required').max(200),
  parentId: z.string().uuid().optional(),
  color: z.string().max(7).optional(),
});

export const UpdateFolderDto = z.object({
  name: z.string().min(1, 'Folder name is required').max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().max(7).nullable().optional(),
});

export type CreateFolderDtoType = z.infer<typeof CreateFolderDto>;
export type UpdateFolderDtoType = z.infer<typeof UpdateFolderDto>;
