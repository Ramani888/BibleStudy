import { z } from 'zod';

export const CreateFolderDto = z.object({
  name: z.string().min(1, 'Folder name is required').max(200),
  parentId: z.string().uuid().optional(),
});

export const UpdateFolderDto = z.object({
  name: z.string().min(1, 'Folder name is required').max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export type CreateFolderDtoType = z.infer<typeof CreateFolderDto>;
export type UpdateFolderDtoType = z.infer<typeof UpdateFolderDto>;
