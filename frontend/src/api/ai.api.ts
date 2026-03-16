import { apiGet, apiPost } from './client';
import type { AIChatPayload, AIChatResponse, AIChat, DailyVerse } from '../types';

interface ChatHistoryParams {
  page?: number;
  limit?: number;
}

interface PaginatedChats {
  chats: AIChat[];
  total: number;
  page: number;
  limit: number;
}

export const aiApi = {
  getDailyVerse: () =>
    apiGet<DailyVerse>('/ai/daily-verse'),

  chat: (payload: AIChatPayload) =>
    apiPost<AIChatResponse>('/ai/chat', payload),

  getHistory: (params?: ChatHistoryParams) =>
    apiGet<PaginatedChats>('/ai/history', params),
};
