import type { Plan } from './user.types';

export interface SubscriptionStatus {
  plan: Plan;
  active: boolean;
  expiresAt: string | null;
}

export interface VerifyPurchasePayload {
  platform: 'APPLE' | 'GOOGLE';
  productId: string;
  receipt: string;
}

export interface VerifyPurchaseResult {
  plan: Plan;
  active: boolean;
  expiresAt: string;
  granted: boolean;
}

export type BillingPeriod = 'monthly' | 'annual';

export interface TierDef {
  plan: Exclude<Plan, 'FREE'>;
  name: string;
  credits: number;
  storage: string;
  aiPerHour: number;
  benefits: string[];
  monthly: { productId: string; priceLabel: string };
  annual: { productId: string; priceLabel: string };
}

// Mirrors backend src/config/plans.ts — product IDs MUST match App Store Connect / Play Console.
export const TIERS: TierDef[] = [
  {
    plan: 'STARTER',
    name: 'Starter',
    credits: 100,
    storage: '2 GB',
    aiPerHour: 60,
    benefits: [
      '100 AI credits per month',
      'Image & PDF analysis',
      '2 GB media storage',
      'Credit usage statistics',
    ],
    monthly: { productId: 'com.biblestudypro.starter.monthly', priceLabel: '$4.99/mo' },
    annual: { productId: 'com.biblestudypro.starter.annual', priceLabel: '$39.99/yr' },
  },
  {
    plan: 'PRO',
    name: 'Pro',
    credits: 500,
    storage: '10 GB',
    aiPerHour: 120,
    benefits: [
      '500 AI credits per month',
      'Priority AI responses',
      '10 GB media storage',
      'Advanced study analytics',
      'Group study plan tools',
      'Export & backup',
    ],
    monthly: { productId: 'com.biblestudypro.pro.monthly', priceLabel: '$9.99/mo' },
    annual: { productId: 'com.biblestudypro.pro.annual', priceLabel: '$79.99/yr' },
  },
];

export const ALL_PRODUCT_IDS = TIERS.flatMap(t => [t.monthly.productId, t.annual.productId]);
