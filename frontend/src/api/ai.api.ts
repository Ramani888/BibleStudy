import { apiGet, apiPost } from './client';
import type { AIChatPayload, AIChatResponse, AIChat, DailyVerse } from '../types';

interface ChatHistoryParams {
  page?: number;
  limit?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface PaginatedChats {
  chats: AIChat[];
  pagination: Pagination;
}

export const aiApi = {
  getDailyVerse: () =>
    apiGet<DailyVerse>('/ai/daily-verse'),

  chat: (payload: AIChatPayload) =>
    apiPost<AIChatResponse>('/ai/chat', payload),

  getHistory: (params?: ChatHistoryParams) =>
    apiGet<PaginatedChats>('/ai/history', params),
};
