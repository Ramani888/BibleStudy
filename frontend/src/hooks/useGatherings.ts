import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gatheringsApi } from '../api/gatherings.api';
import type { CreateGatheringPayload, UpdateGatheringPayload } from '../types/gatherings.types';

export function useGatherings(params?: { groupId?: string; upcoming?: boolean; page?: number }) {
  return useQuery({
    queryKey: ['gatherings', 'list', params],
    queryFn: () => gatheringsApi.list(params),
  });
}

export function useGathering(id: string) {
  return useQuery({
    queryKey: ['gatherings', 'detail', id],
    queryFn: () => gatheringsApi.getById(id),
    enabled: !!id,
  });
}

export function useNearbyGatherings(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['gatherings', 'nearby', lat, lng],
    queryFn: () => gatheringsApi.nearby(lat!, lng!),
    enabled: lat != null && lng != null,
  });
}

export function useParticipants(gatheringId: string) {
  return useQuery({
    queryKey: ['gatherings', 'detail', gatheringId, 'participants'],
    queryFn: () => gatheringsApi.participants(gatheringId),
    enabled: !!gatheringId,
  });
}

export function useCreateGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGatheringPayload) => gatheringsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gatherings'] }),
  });
}

export function useUpdateGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGatheringPayload }) =>
      gatheringsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['gatherings'] });
      qc.invalidateQueries({ queryKey: ['gatherings', 'detail', id] });
    },
  });
}

export function useCancelGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatheringsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gatherings'] }),
  });
}

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'GOING' | 'MAYBE' | 'NOT_GOING' }) =>
      gatheringsApi.rsvp(id, status),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['gatherings', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['gatherings', 'list'] });
    },
  });
}

export function useLeaveGathering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatheringsApi.leave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gatherings'] }),
  });
}
