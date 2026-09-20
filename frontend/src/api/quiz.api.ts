import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { QuizAttemptWithSet, RecordAttemptPayload, RecordAttemptResult, SummaryItem } from '../types';
import type { GeneratedQuizCard } from '../navigation/types';

export const quizApi = {
  // AI quiz generation — ephemeral cards from a document (media) OR the user's
  // sets OR a topic. 60s timeout (free models cold-start slowly).
  generateQuiz: (body: { topic?: string; setIds?: string[]; mediaIds?: string[]; count?: number }) =>
    apiPost<{ cards: GeneratedQuizCard[]; creditsUsed: number }>(
      '/quiz/generate',
      body,
      { timeout: 60000 },
    ),

  recordAttempt: (payload: RecordAttemptPayload) =>
    apiPost<RecordAttemptResult>('/quiz/attempts', payload),

  updateAttempt: (attemptId: string, payload: RecordAttemptPayload) =>
    apiPut<{ best: number | null }>(`/quiz/attempts/${attemptId}`, payload),

  deleteAttempt: (attemptId: string) =>
    apiDelete(`/quiz/attempts/${attemptId}`),

  getRecentAttempts: (limit = 20) =>
    apiGet<QuizAttemptWithSet[]>(`/quiz/attempts/recent?limit=${limit}`),

  getAttemptResponses: (attemptId: string) =>
    apiGet<{ responses: SummaryItem[] | null }>(`/quiz/attempts/${attemptId}/responses`),
};
