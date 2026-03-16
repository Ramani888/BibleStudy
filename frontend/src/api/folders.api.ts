import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { CreateFolderPayload, Folder, UpdateFolderPayload } from '../types';

export const foldersApi = {
  create: (payload: CreateFolderPayload) =>
    apiPost<Folder>('/folders', payload),

  list: () =>
    apiGet<Folder[]>('/folders'),

  getById: (id: string) =>
    apiGet<Folder>(`/folders/${id}`),

  update: (id: string, payload: UpdateFolderPayload) =>
    apiPut<Folder>(`/folders/${id}`, payload),

  delete: (id: string) =>
    apiDelete(`/folders/${id}`),
};
