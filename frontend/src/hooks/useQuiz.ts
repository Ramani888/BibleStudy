import { useCallback } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '../api';
import { cardsApi } from '../api';
import type { RecordAttemptPayload } from '../types';
import type { Card } from '../types/card.types';

/** Fetch cards from multiple sets in parallel, merged into one stable array. */
export function useCardsForSets(setIds: string[]) {
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

/** Recent quiz attempts — powers the Quiz hub list. */
export function useRecentQuizAttempts(limit = 20) {
  return useQuery({
    queryKey: ['quiz', 'attempts', 'recent', limit],
    queryFn: () => quizApi.getRecentAttempts(limit),
  });
}

/** Best score + attempt count per set — powers Quiz hub badges. */
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

/**
 * Unified save hook for quiz completion.
 * - No retakeAttemptId → creates a new attempt (POST)
 * - retakeAttemptId present → updates the existing attempt (PUT)
 * Both paths invalidate all ['quiz'] queries on success.
 */
export function useQuizAttemptSave(retakeAttemptId?: string) {
  const qc = useQueryClient();
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['quiz'] }), [qc]);

  const create = useMutation({
    mutationFn: (payload: RecordAttemptPayload) => quizApi.recordAttempt(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: (payload: RecordAttemptPayload) =>
      quizApi.updateAttempt(retakeAttemptId!, payload),
    onSuccess: invalidate,
  });

  const active = retakeAttemptId ? update : create;

  const save = useCallback(
    (payload: RecordAttemptPayload) =>
      retakeAttemptId
        ? update.mutateAsync(payload)
        : create.mutateAsync(payload),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retakeAttemptId],
  );

  return {
    save,
    isPending: active.isPending,
    isError: active.isError,
    error: active.error,
  };
}

/** Responses for a single attempt — fetched on demand (not included in list). */
export function useQuizAttemptResponses(attemptId: string) {
  return useQuery({
    queryKey: ['quiz', 'attempt', attemptId, 'responses'],
    queryFn: () => quizApi.getAttemptResponses(attemptId),
    enabled: !!attemptId,
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
