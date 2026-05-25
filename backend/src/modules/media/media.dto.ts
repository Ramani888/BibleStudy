import { z } from 'zod';

export const ListMediaDto = z.object({
  type: z.enum(['IMAGE', 'PDF']).optional(),
});

export type ListMediaDtoType = z.infer<typeof ListMediaDto>;
