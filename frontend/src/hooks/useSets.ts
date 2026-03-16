import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
