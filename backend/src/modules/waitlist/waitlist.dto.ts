import { z } from 'zod';

export const CreateWaitlistDto = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required').max(320),
  country: z.string().trim().max(100).optional(),
});

export type CreateWaitlistDtoType = z.infer<typeof CreateWaitlistDto>;
