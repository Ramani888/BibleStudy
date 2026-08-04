import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '../api';
import type {
  BulkCreateCardPayload,
  CreateCardPayload,
  MoveCardPayload,
  ReorderCardsPayload,
  UpdateCardPayload,
} from '../types';

export function useCards(setId: string) {
  return useQuery({
    queryKey: ['cards', setId],
    queryFn: () => cardsApi.listBySet(setId),
    enabled: !!setId,
  });
}

export function useCardById(cardId: string) {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: () => cardsApi.getById(cardId),
    enabled: !!cardId,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardPayload) => cardsApi.create(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cards', vars.setId] });
      qc.invalidateQueries({ queryKey: ['sets'] });
    },
  });
}

export function useBulkCreateCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkCreateCardPayload) => cardsApi.bulkCreate(payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cards', vars.setId] });
      qc.invalidateQueries({ queryKey: ['sets'] });
    },
  });
}

export function useUpdateCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCardPayload }) =>
      cardsApi.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cards', setId] });
      qc.invalidateQueries({ queryKey: ['card', vars.id] });
    },
  });
}

export function useDeleteCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards', setId] });
      qc.invalidateQueries({ queryKey: ['sets'] });
    },
  });
}

export function useCopyCard(setId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.copy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cards', setId] });
      qc.invalidateQueries({ queryKey: ['sets'] });
    },
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
      qc.invalidateQueries({ queryKey: ['sets'] });
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
