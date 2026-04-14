import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Group, GroupMember, CreateGroupPayload, UpdateGroupPayload } from '../types/groups.types';

const groupsApi = {
  list:             ()                                => apiGet<Group[]>('/groups'),
  create:           (payload: CreateGroupPayload)     => apiPost<Group>('/groups', payload),
  getById:          (id: string)                      => apiGet<Group>(`/groups/${id}`),
  update:           (id: string, payload: UpdateGroupPayload) => apiPut<Group>(`/groups/${id}`, payload),
  delete:           (id: string)                      => apiDelete<{ message: string }>(`/groups/${id}`),
  joinByCode:       (inviteCode: string)              => apiPost<Group>(`/groups/join/${inviteCode}`),
  leave:            (id: string)                      => apiDelete<{ message: string }>(`/groups/${id}/leave`),
  updateMemberRole: (groupId: string, userId: string, role: 'ADMIN' | 'MEMBER') =>
    apiPut<GroupMember>(`/groups/${groupId}/members/${userId}/role`, { role }),
  removeMember:     (groupId: string, userId: string) =>
    apiDelete<{ message: string }>(`/groups/${groupId}/members/${userId}`),
  regenerateInvite: (id: string)                      => apiPost<{ inviteCode: string }>(`/groups/${id}/regenerate-invite`),
  listPublic:       (params?: { search?: string; page?: number }) =>
    apiGet<{ groups: Group[]; pagination: { total: number; page: number; limit: number; pages: number } }>('/groups/public', params),
};

export { groupsApi };
