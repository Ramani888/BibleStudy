import { apiGet, apiPost } from './client';
import type { CreditBalance, CreditTransaction, Pagination, TransactionType } from '../types';

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

  watchAd: () =>
    apiPost<DailyLoginResult>('/credits/watch-ad'),

  getStreak: () =>
    apiGet<{ streak: number; longestStreak: number }>('/credits/streak'),

  getStats: (period: string, from?: Date, to?: Date, interval?: string) =>
    apiGet<StatPoint[]>('/credits/stats', {
      period,
      ...(from     && { from:     from.toISOString()     }),
      ...(to       && { to:       to.toISOString()       }),
      ...(interval && { interval                         }),
    }),
};
