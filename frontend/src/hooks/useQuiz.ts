import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api';
import type { RecordAttemptPayload } from '../types';

/** Best score + attempt count per set — powers the Quiz hub badges. */
export function useAllQuizBest() {
  return useQuery({
    queryKey: ['quiz', 'best'],
    queryFn: quizApi.getAllBest,
  });
}

/** Best score for a single set. */
export function useQuizBest(setId: string) {
  return useQuery({
    queryKey: ['quiz', 'best', setId],
    queryFn: () => quizApi.getBest(setId),
    enabled: !!setId,
  });
}

/** Persist a finished quiz attempt; refreshes best-score queries on success. */
export function useRecordQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordAttemptPayload) => quizApi.recordAttempt(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}
