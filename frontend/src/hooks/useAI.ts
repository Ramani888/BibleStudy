import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api';
import { useAuthStore } from '../store';
import type { AIChatPayload } from '../types';

export function useAIChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AIChatPayload) => aiApi.chat(payload),
    onSuccess: data => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
      qc.invalidateQueries({ queryKey: ['credits'] });
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.getState().updateUser({
          ...current,
          creditBalance: Math.max(0, (current.creditBalance ?? 0) - data.creditsUsed),
        });
      }
    },
  });
}

export function useAIChatHistory() {
  return useInfiniteQuery({
    queryKey: ['ai-history'],
    queryFn: ({ pageParam = 1 }) => aiApi.getHistory({ page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.chats.length, 0);
      return loaded < last.pagination.total ? all.length + 1 : undefined;
    },
  });
}
