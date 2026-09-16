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
      // Deleting a set cascades its StudyPlanStep + progress rows; refresh plan lists/details so a
      // mounted PlanDetail doesn't show a phantom step whose "complete" targets a deleted step.
      qc.invalidateQueries({ queryKey: ['plans'] });
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

export function useUserSets(userId: string) {
  return useQuery({
    queryKey: ['sets', 'user', userId],
    queryFn: () => setsApi.getByUser(userId),
    enabled: !!userId,
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
