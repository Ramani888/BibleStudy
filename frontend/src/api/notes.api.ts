import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { CreateNotePayload, Note, UpdateNotePayload } from '../types';

export const notesApi = {
  create: (payload: CreateNotePayload) =>
    apiPost<Note>('/notes', payload),

  list: () =>
    apiGet<Note[]>('/notes'),

  getById: (id: string) =>
    apiGet<Note>(`/notes/${id}`),

  update: (id: string, payload: UpdateNotePayload) =>
    apiPut<Note>(`/notes/${id}`, payload),

  delete: (id: string) =>
    apiDelete(`/notes/${id}`),
};
