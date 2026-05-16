import { z } from 'zod';

export const ClaimDailyLoginDto = z.object({});
export type ClaimDailyLoginDtoType = z.infer<typeof ClaimDailyLoginDto>;
