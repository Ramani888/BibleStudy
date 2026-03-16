import { apiGet, apiPost } from './client';
import type { CreditBalance, CreditTransaction, TransactionType } from '../types';

interface TransactionParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

interface PaginatedTransactions {
  transactions: CreditTransaction[];
  total: number;
  page: number;
  limit: number;
}

export const creditsApi = {
  getBalance: () =>
    apiGet<CreditBalance>('/credits/balance'),

  getTransactions: (params?: TransactionParams) =>
    apiGet<PaginatedTransactions>('/credits/transactions', params),

  claimDailyLogin: () =>
    apiPost<{ credited: number; newBalance: number }>('/credits/daily-login'),
};
