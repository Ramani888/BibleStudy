import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../api';
import type { CreateFolderPayload, UpdateFolderPayload } from '../types';

export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: foldersApi.list,
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => foldersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => foldersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useUpdateFolder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFolderPayload) => foldersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fid: string) => foldersApi.delete(fid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}
