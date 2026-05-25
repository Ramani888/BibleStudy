import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../api';
import type { MediaFileType } from '../types';

export function useMediaFiles(type?: MediaFileType) {
  return useQuery({
    queryKey: ['media', type ?? 'all'],
    queryFn: () => mediaApi.list(type),
  });
}

export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage'],
    queryFn: mediaApi.getStorage,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      formData,
      onProgress,
    }: {
      formData: FormData;
      onProgress?: (pct: number) => void;
    }) => mediaApi.upload(formData, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['storage'] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['storage'] });
    },
  });
}
