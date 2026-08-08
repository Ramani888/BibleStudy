import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { AIChatPayload, AIChatResponse, BookmarkedChat, ChatSession, DailyVerse, Pagination } from '../types';

interface ChatHistoryParams {
  page?: number;
  limit?: number;
}

interface PaginatedSessions {
  sessions: ChatSession[];
  pagination: Pagination;
}

interface PaginatedBookmarks {
  bookmarks: BookmarkedChat[];
  pagination: Pagination;
}

export const aiApi = {
  getDailyVerse: () =>
    apiGet<DailyVerse>('/ai/daily-verse'),

  chat: (payload: AIChatPayload) =>
    // AI generation (esp. flashcards on free models) can exceed the default 15s.
    apiPost<AIChatResponse>('/ai/chat', payload, { timeout: 60_000 }),

  getHistory: (params?: ChatHistoryParams) =>
    apiGet<PaginatedSessions>('/ai/history', params),

  deleteSession: (sessionId: string) =>
    apiDelete(`/ai/history/${sessionId}`),

  clearHistory: () =>
    apiDelete('/ai/history'),

  renameSession: (sessionId: string, title: string) =>
    apiPatch<void>(`/ai/history/${sessionId}/title`, { title }),

  updateTags: (sessionId: string, tags: string[]) =>
    apiPatch<void>(`/ai/history/${sessionId}/tags`, { tags }),

  getBookmarks: (params?: ChatHistoryParams) =>
    apiGet<PaginatedBookmarks>('/ai/bookmarks', params),

  addBookmark: (chatId: string) =>
    apiPost<void>('/ai/bookmarks', { chatId }),

  removeBookmark: (chatId: string) =>
    apiDelete(`/ai/bookmarks/${chatId}`),

  markCardsSaved: (chatId: string) =>
    apiPatch<void>(`/ai/chats/${chatId}/cards-saved`),
};
