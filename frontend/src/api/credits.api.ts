import { apiGet, apiPost } from './client';
import type { CreditBalance, CreditTransaction, TransactionType } from '../types';

interface TransactionParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
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

export const creditsApi = {
  getBalance: () =>
    apiGet<CreditBalance>('/credits/balance'),

  getTransactions: (params?: TransactionParams) =>
    apiGet<PaginatedTransactions>('/credits/transactions', params),

  claimDailyLogin: () =>
    apiPost<DailyLoginResult>('/credits/daily-login'),
};
