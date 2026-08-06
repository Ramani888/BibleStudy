import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { QuizAttemptWithSet, RecordAttemptPayload, RecordAttemptResult, SetBestScore } from '../types';

export const quizApi = {
  recordAttempt: (payload: RecordAttemptPayload) =>
    apiPost<RecordAttemptResult>('/quiz/attempts', payload),

  updateAttempt: (attemptId: string, payload: RecordAttemptPayload) =>
    apiPut<{ best: number | null }>(`/quiz/attempts/${attemptId}`, payload),

  deleteAttempt: (attemptId: string) =>
    apiDelete(`/quiz/attempts/${attemptId}`),

  getBest: (setId: string) =>
    apiGet<{ best: number | null }>(`/quiz/sets/${setId}/best`),

  getAllBest: () =>
    apiGet<SetBestScore[]>('/quiz/best'),

  getRecentAttempts: (limit = 20) =>
    apiGet<QuizAttemptWithSet[]>(`/quiz/attempts/recent?limit=${limit}`),
};
