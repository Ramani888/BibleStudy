import { apiGet, apiPost } from './client';
import type { CreditBalance, CreditTransaction, Pagination, TransactionType, ReferralInfo } from '../types';

interface TransactionParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

interface PaginatedTransactions {
  transactions: CreditTransaction[];
  pagination: Pagination;
}

interface DailyLoginResult {
  balance: number;
  transaction: CreditTransaction;
  message: string;
}

interface StatPoint { label: string; earned: number; used: number; }

export const creditsApi = {
  getBalance: () =>
    apiGet<CreditBalance>('/credits/balance'),

  getTransactions: (params?: TransactionParams) =>
    apiGet<PaginatedTransactions>('/credits/transactions', params),

  claimDailyLogin: () =>
    apiPost<DailyLoginResult>('/credits/daily-login'),

  getStreak: () =>
    apiGet<{ streak: number; longestStreak: number; freezes: number }>('/credits/streak'),

  getReferral: () =>
    apiGet<ReferralInfo>('/credits/referral'),

  redeemReferral: (code: string) =>
    apiPost<{ balance: number; granted: number }>('/credits/referral/redeem', { code }),

  getStats: (period: string, from?: Date, to?: Date, interval?: string) =>
    apiGet<StatPoint[]>('/credits/stats', {
      period,
      ...(from     && { from:     from.toISOString()     }),
      ...(to       && { to:       to.toISOString()       }),
      ...(interval && { interval                         }),
    }),
};
