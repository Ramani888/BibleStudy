import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditsApi } from '../api';

export type CreditStatsPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';
export type CreditInterval    = '1h' | '2h' | '6h' | 'day' | 'week' | 'month' | 'quarter';

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: creditsApi.getBalance,
  });
}

export function useCreditTransactions() {
  return useInfiniteQuery({
    queryKey: ['credits', 'transactions'],
    queryFn: ({ pageParam = 1 }) =>
      creditsApi.getTransactions({ page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.transactions.length, 0);
      return loaded < last.pagination.total ? all.length + 1 : undefined;
    },
  });
}

export function useClaimDailyLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creditsApi.claimDailyLogin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['credits'] });
    },
  });
}

export type DayStat = { label: string; earned: number; used: number };

export function useCreditStats(period: CreditStatsPeriod, from?: Date, to?: Date, interval?: CreditInterval) {
  return useQuery({
    queryKey: ['credits', 'stats', period, from?.toISOString(), to?.toISOString(), interval],
    queryFn: () => creditsApi.getStats(period, from, to, interval),
    enabled: period !== 'custom' || (!!from && !!to),
  });
}
