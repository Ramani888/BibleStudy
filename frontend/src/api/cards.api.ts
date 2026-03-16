import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type {
  BulkCreateCardPayload,
  Card,
  CreateCardPayload,
  ReorderCardsPayload,
  StudyResultPayload,
  UpdateCardPayload,
} from '../types';

export const cardsApi = {
  create: (payload: CreateCardPayload) =>
    apiPost<Card>('/cards', payload),

  bulkCreate: (payload: BulkCreateCardPayload) =>
    apiPost<Card[]>('/cards/bulk', payload),

  reorder: (payload: ReorderCardsPayload) =>
    apiPost<void>('/cards/reorder', payload),

  listBySet: (setId: string) =>
    apiGet<Card[]>(`/cards/set/${setId}`),

  getById: (id: string) =>
    apiGet<Card>(`/cards/${id}`),

  update: (id: string, payload: UpdateCardPayload) =>
    apiPut<Card>(`/cards/${id}`, payload),

  delete: (id: string) =>
    apiDelete(`/cards/${id}`),

  recordStudy: (id: string, payload: StudyResultPayload) =>
    apiPost<Card>(`/cards/${id}/study`, payload),
};
