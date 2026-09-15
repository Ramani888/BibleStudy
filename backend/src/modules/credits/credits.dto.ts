import { z } from 'zod';

export const ClaimDailyLoginDto = z.object({});
export type ClaimDailyLoginDtoType = z.infer<typeof ClaimDailyLoginDto>;

export const RedeemReferralDto = z.object({
  code: z.string().trim().min(4).max(16),
});
export type RedeemReferralDtoType = z.infer<typeof RedeemReferralDto>;
