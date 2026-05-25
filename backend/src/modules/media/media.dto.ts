import { z } from 'zod';

export const ListMediaDto = z.object({
  type: z.enum(['IMAGE', 'PDF']).optional(),
});

export type ListMediaDtoType = z.infer<typeof ListMediaDto>;

export const RenameMediaDto = z.object({
  name: z.string().trim().min(1).max(255),
});

export type RenameMediaDtoType = z.infer<typeof RenameMediaDto>;
