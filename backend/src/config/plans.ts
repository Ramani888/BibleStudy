import type { Plan } from '@prisma/client';

/**
 * Single source of truth for subscription tiers (locked decision #4).
 * Everything downstream — credit grants, storage limits, AI rate limits, the
 * paywall, receipt verification — reads product IDs and benefits from here.
 *
 * Store product IDs must match what you create in App Store Connect / Play Console.
 * Keep monthly/annual as separate products; annual grants 12× credits upfront (E decision #2).
 */

export interface PlanBenefits {
  credits: number;        // credits granted per monthly period (annual = ×12 upfront)
  storageBytes: number;   // storageLimit set on the user
  aiPerHour: number;      // aiRateLimit ceiling
}

export const PLAN_BENEFITS: Record<Plan, PlanBenefits> = {
  FREE:    { credits: 0,   storageBytes: 262_144_000,   aiPerHour: 30 },   // 250 MB, default
  STARTER: { credits: 100, storageBytes: 2_147_483_648, aiPerHour: 60 },   // 2 GB
  PRO:     { credits: 500, storageBytes: 10_737_418_240, aiPerHour: 120 }, // 10 GB
};

export type BillingPeriod = 'monthly' | 'annual';

export interface ProductDef {
  productId: string;
  plan: Exclude<Plan, 'FREE'>;
  period: BillingPeriod;
  priceUsd: number;       // display only; the store is the source of truth for real pricing
}

// productId → tier/period. Add the real store IDs here once products are created.
export const PRODUCTS: Record<string, ProductDef> = {
  'com.biblestudypro.starter.monthly': { productId: 'com.biblestudypro.starter.monthly', plan: 'STARTER', period: 'monthly', priceUsd: 4.99 },
  'com.biblestudypro.starter.annual':  { productId: 'com.biblestudypro.starter.annual',  plan: 'STARTER', period: 'annual',  priceUsd: 39.99 },
  'com.biblestudypro.pro.monthly':     { productId: 'com.biblestudypro.pro.monthly',     plan: 'PRO',     period: 'monthly', priceUsd: 9.99 },
  'com.biblestudypro.pro.annual':      { productId: 'com.biblestudypro.pro.annual',      plan: 'PRO',     period: 'annual',  priceUsd: 79.99 },
};

export function getProduct(productId: string): ProductDef | undefined {
  return PRODUCTS[productId];
}

// Credits to grant for a purchase/renewal: annual pays 12× upfront (E decision #2).
export function creditsForPurchase(def: ProductDef): number {
  const base = PLAN_BENEFITS[def.plan].credits;
  return def.period === 'annual' ? base * 12 : base;
}
