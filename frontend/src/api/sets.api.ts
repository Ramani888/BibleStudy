import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { CreateSetPayload, StudySet, UpdateSetPayload } from '../types';

interface ListSetsParams {
  folderId?: string;
}

interface PublicSetsParams {
  page?: number;
  limit?: number;
}

interface PaginatedSets {
  sets: StudySet[];
  total: number;
  page: number;
  limit: number;
}

export const setsApi = {
  getPublic: (params?: PublicSetsParams) =>
    apiGet<PaginatedSets>('/sets/public', params),

  create: (payload: CreateSetPayload) =>
    apiPost<StudySet>('/sets', payload),

  list: (params?: ListSetsParams) =>
    apiGet<StudySet[]>('/sets', params),

  getById: (id: string) =>
    apiGet<StudySet>(`/sets/${id}`),

  update: (id: string, payload: UpdateSetPayload) =>
    apiPut<StudySet>(`/sets/${id}`, payload),

  delete: (id: string) =>
    apiDelete(`/sets/${id}`),

  clone: (id: string) =>
    apiPost<StudySet>(`/sets/${id}/clone`),
};
