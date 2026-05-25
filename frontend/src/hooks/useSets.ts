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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUpdateSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSetPayload }) =>
      setsApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useCloneSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setsApi.clone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sets'] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useFriendsSets() {
  return useInfiniteQuery({
    queryKey: ['friends-sets'],
    queryFn: ({ pageParam = 1 }) =>
      setsApi.getFriends({ page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
  });
}

export function usePublicSets(search?: string) {
  return useInfiniteQuery({
    queryKey: ['public-sets', search],
    queryFn: ({ pageParam = 1 }) =>
      setsApi.getPublic({ page: pageParam as number, limit: 20, search }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages ? last.pagination.page + 1 : undefined,
  });
}
