import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setsApi } from '../api';
import type { CreateSetPayload, UpdateSetPayload } from '../types';

export function useSets(folderId?: string) {
  return useQuery({
    queryKey: ['sets', { folderId }],
    queryFn: () => setsApi.list(folderId ? { folderId } : undefined),
  });
}

export function useSet(id: string) {
  return useQuery({
    queryKey: ['sets', id],
    queryFn: () => setsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSetPayload) => setsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  });
}

export function useUpdateSet(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSetPayload) => setsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  });
}

export function useCloneSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setsApi.clone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sets'] }),
  });
}

export function usePublicSets() {
  return useInfiniteQuery({
    queryKey: ['public-sets'],
    queryFn: ({ pageParam = 1 }) =>
      setsApi.getPublic({ page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p) => sum + p.sets.length, 0);
      return loaded < last.pagination.total ? all.length + 1 : undefined;
    },
  });
}
