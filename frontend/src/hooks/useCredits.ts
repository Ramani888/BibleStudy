import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditsApi } from '../api';
import { useAuthStore } from '../store';

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
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['credits'] });
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.getState().updateUser({ ...current, creditBalance: res.balance });
      }
    },
  });
}
