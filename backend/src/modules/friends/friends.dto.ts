import { z } from 'zod';

export const SendRequestDto = z.object({
  receiverId: z.string().uuid('Invalid user ID'),
});

export type SendRequestDtoType = z.infer<typeof SendRequestDto>;
