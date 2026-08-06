import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api';
import { cardsApi } from '../api';
import type { RecordAttemptPayload } from '../types';
import type { Card } from '../types/card.types';

/** Fetch cards from multiple sets in parallel, merged into one stable array. */
export function useCardsForSets(setIds: string[]) {
  // `combine` is memoized by React Query — avoids variable-length dep array bug
  // that caused stale empty data when adding/removing sets.
  return useQueries({
    queries: setIds.map(id => ({
      queryKey: ['cards', id],
      queryFn: () => cardsApi.listBySet(id),
      enabled: !!id,
    })),
    combine: (results) => ({
      data: results.flatMap(r => r.data ?? []) as Card[],
      isLoading: results.some(r => r.isLoading),
      isError: results.some(r => r.isError),
    }),
  });
}

/** Recent quiz attempts with set titles — powers the Quiz hub history list. */
export function useRecentQuizAttempts(limit = 20) {
  return useQuery({
    queryKey: ['quiz', 'attempts', 'recent', limit],
    queryFn: () => quizApi.getRecentAttempts(limit),
  });
}

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

/** Delete a quiz attempt; refreshes the hub list on success. */
export function useDeleteQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) => quizApi.deleteAttempt(attemptId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}

/** Overwrite an existing attempt (Re-Quiz flow); refreshes all quiz queries on success. */
export function useUpdateQuizAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, payload }: { attemptId: string; payload: RecordAttemptPayload }) =>
      quizApi.updateAttempt(attemptId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quiz'] }),
  });
}
