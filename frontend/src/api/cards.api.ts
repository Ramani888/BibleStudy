import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './client';
import type {
  BulkCreateCardPayload,
  Card,
  CreateCardPayload,
  DueSummary,
  MoveCardPayload,
  ReorderCardsPayload,
  UpdateCardPayload,
} from '../types';

export const cardsApi = {
  dueSummary: () =>
    apiGet<DueSummary>('/cards/due-summary'),

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

  copy: (id: string) =>
    apiPost<Card>(`/cards/${id}/copy`),

  move: (id: string, payload: MoveCardPayload) =>
    apiPatch<Card>(`/cards/${id}/move`, payload),
};
