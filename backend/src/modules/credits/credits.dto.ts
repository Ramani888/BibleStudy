import { z } from 'zod';

export const PaginationDto = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export type PaginationDtoType = z.infer<typeof PaginationDto>;
