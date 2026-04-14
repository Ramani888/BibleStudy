import { z } from 'zod';

export const MarkReadDto = z.object({});

export type MarkReadDtoType = z.infer<typeof MarkReadDto>;
