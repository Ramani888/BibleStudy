import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { CreateSetPayload, Pagination, StudySet, UpdateSetPayload } from '../types';

interface ListSetsParams {
  folderId?: string;
}

interface PublicSetsParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface PaginatedSets {
  sets: StudySet[];
  pagination: Pagination;
}

export const setsApi = {
  getPublic: (params?: PublicSetsParams) =>
    apiGet<PaginatedSets>('/sets/public', params),

  getFriends: (params?: { page?: number; limit?: number }) =>
    apiGet<PaginatedSets>('/sets/friends', params),

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
