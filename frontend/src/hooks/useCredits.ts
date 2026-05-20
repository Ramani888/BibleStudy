import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditsApi } from '../api';
import type { CreditTransaction } from '../types';

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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayStat = { label: string; earned: number; used: number };

function aggregateLast7Days(transactions: CreditTransaction[]): DayStat[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dayTxs = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d >= date && d <= end;
    });

    return {
      label: DAY_LABELS[date.getDay()],
      earned: dayTxs.filter(t => t.type === 'REWARD').reduce((s, t) => s + t.amount, 0),
      used: dayTxs.filter(t => t.type === 'USAGE').reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  });
}

export function useWeeklyCredits() {
  return useQuery({
    queryKey: ['credits', 'weekly'],
    queryFn: () => creditsApi.getTransactions({ limit: 100 }),
    select: (data) => aggregateLast7Days(data.transactions),
  });
}
