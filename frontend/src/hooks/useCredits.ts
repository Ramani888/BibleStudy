import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditsApi } from '../api';

export function useCreditBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: creditsApi.getBalance,
  });
}

export function useCreditTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['credits', 'transactions', { page, limit }],
    queryFn: () => creditsApi.getTransactions({ page, limit }),
  });
}

export function useClaimDailyLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: creditsApi.claimDailyLogin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credits'] }),
  });
}
