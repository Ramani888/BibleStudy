import { z } from 'zod';

export const VerifyPurchaseDto = z.object({
  platform: z.enum(['APPLE', 'GOOGLE']),
  productId: z.string().min(1),
  // Apple: base64 app receipt. Google: purchaseToken.
  receipt: z.string().min(1),
});

export type VerifyPurchaseDtoType = z.infer<typeof VerifyPurchaseDto>;
