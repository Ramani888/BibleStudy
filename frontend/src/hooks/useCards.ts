import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api';
import type {
  BulkCreateCardPayload,
  CreateCardPayload,
  MoveCardPayload,
  ReorderCardsPayload,
  StudyResultPayload,
  UpdateCardPayload,
} from '../types';

export function useCards(setId: string) {
  return useQuery({
    queryKey: ['cards', setId],
    queryFn: () => cardsApi.listBySet(setId),
    enabled: !!setId,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) => cardsApi.create(payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cards', vars.setId] }),
  });
}

export function useBulkCreateCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkCreateCardPayload) => cardsApi.bulkCreate(payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cards', vars.setId] }),
  });
}

export function useUpdateCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCardPayload }) =>
      cardsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  });
}

export function useDeleteCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  });
}

export function useCopyCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.copy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  });
}

export function useMoveCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MoveCardPayload }) =>
      cardsApi.move(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cards', setId] });
      qc.invalidateQueries({ queryKey: ['cards', vars.payload.targetSetId] });
    },
  });
}

export function useReorderCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderCardsPayload) => cardsApi.reorder(payload),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['cards', vars.setId] }),
  });
}

export function useRecordStudy(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StudyResultPayload }) =>
      cardsApi.recordStudy(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cards', setId] }),
  });
}
