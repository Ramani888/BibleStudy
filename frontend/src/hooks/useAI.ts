import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api';
import type { AIChatPayload } from '../types';

export function useAIChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AIChatPayload) => aiApi.chat(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
      qc.invalidateQueries({ queryKey: ['credits'] });
    },
  });
}

export function useMarkCardsSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => aiApi.markCardsSaved(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
    },
  });
}

export function useAIChatHistory() {
  return useInfiniteQuery({
    queryKey: ['ai-history'],
    queryFn: ({ pageParam = 1 }) => aiApi.getHistory({ page: pageParam as number, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.sessions.length, 0);
      return loaded < last.pagination.total ? all.length + 1 : undefined;
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => aiApi.deleteSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
    },
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiApi.clearHistory(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
      qc.invalidateQueries({ queryKey: ['ai-bookmarks'] });
    },
  });
}

export function useRenameSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, title }: { sessionId: string; title: string }) =>
      aiApi.renameSession(sessionId, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
    },
  });
}

export function useUpdateSessionTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, tags }: { sessionId: string; tags: string[] }) =>
      aiApi.updateTags(sessionId, tags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-history'] });
    },
  });
}

export function useBookmarks(enabled = true) {
  return useQuery({
    queryKey: ['ai-bookmarks'],
    queryFn: () => aiApi.getBookmarks({ limit: 50 }),
    enabled,
    staleTime: 30_000,
  });
}

export function useAddBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => aiApi.addBookmark(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-bookmarks'] });
    },
  });
}

export function useRemoveBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => aiApi.removeBookmark(chatId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-bookmarks'] });
    },
  });
}
