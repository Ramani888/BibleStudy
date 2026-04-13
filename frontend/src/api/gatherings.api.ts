import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type {
  Gathering,
  GatheringParticipant,
  GatheringListResponse,
  CreateGatheringPayload,
  UpdateGatheringPayload,
} from '../types/gatherings.types';

const gatheringsApi = {
  list: (params?: { groupId?: string; upcoming?: boolean; page?: number; limit?: number }) =>
    apiGet<GatheringListResponse>('/gatherings', params),
  nearby: (lat: number, lng: number, radius?: number) =>
    apiGet<Gathering[]>('/gatherings/nearby', { lat, lng, radius }),
  getById:      (id: string)                              => apiGet<Gathering>(`/gatherings/${id}`),
  create:       (payload: CreateGatheringPayload)         => apiPost<Gathering>('/gatherings', payload),
  update:       (id: string, payload: UpdateGatheringPayload) => apiPut<Gathering>(`/gatherings/${id}`, payload),
  cancel:       (id: string)                              => apiDelete<{ message: string }>(`/gatherings/${id}`),
  rsvp:         (id: string, status: 'GOING' | 'MAYBE' | 'NOT_GOING') =>
    apiPost<{ message: string }>(`/gatherings/${id}/rsvp`, { status }),
  leave:        (id: string)                              => apiDelete<{ message: string }>(`/gatherings/${id}/leave`),
  participants: (id: string)                              => apiGet<GatheringParticipant[]>(`/gatherings/${id}/participants`),
};

export { gatheringsApi };
