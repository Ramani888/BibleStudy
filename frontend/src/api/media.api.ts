import { apiClient, apiDelete, apiGet, apiPatch } from './client';
import type { MediaFile, MediaFileType, StorageUsage } from '../types';

export const mediaApi = {
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient
      .post<{ data: MediaFile }>('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
        onUploadProgress: e =>
          onProgress?.(Math.min(100, Math.round((e.loaded / (e.total || e.loaded || 1)) * 100))),
      })
      .then(res => res.data.data),

  list: (type?: MediaFileType) =>
    apiGet<MediaFile[]>('/media', type ? { type } : undefined),

  getStorage: () =>
    apiGet<StorageUsage>('/media/storage'),

  delete: (id: string) =>
    apiDelete(`/media/${id}`),

  rename: (id: string, name: string) =>
    apiPatch<MediaFile>(`/media/${id}`, { name }),
};
