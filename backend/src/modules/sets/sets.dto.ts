import { z } from 'zod';

export const CreateSetDto = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  folderId: z.string().uuid().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'FRIENDS']).optional(),
  layout: z.enum(['DEFAULT', 'MINIMAL', 'DETAILED']).optional(),
});

export const UpdateSetDto = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'FRIENDS']).optional(),
  layout: z.enum(['DEFAULT', 'MINIMAL', 'DETAILED']).optional(),
});

export type CreateSetDtoType = z.infer<typeof CreateSetDto>;
export type UpdateSetDtoType = z.infer<typeof UpdateSetDto>;
