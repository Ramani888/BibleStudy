import { apiGet, apiPost } from './client';
import type { RecordAttemptPayload, RecordAttemptResult, SetBestScore } from '../types';

export const quizApi = {
  recordAttempt: (payload: RecordAttemptPayload) =>
    apiPost<RecordAttemptResult>('/quiz/attempts', payload),

  getBest: (setId: string) =>
    apiGet<{ best: number | null }>(`/quiz/sets/${setId}/best`),

  getAllBest: () =>
    apiGet<SetBestScore[]>('/quiz/best'),
};
