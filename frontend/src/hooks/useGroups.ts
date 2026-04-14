import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups.api';
import type { CreateGroupPayload, UpdateGroupPayload } from '../types/groups.types';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  });
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: ['groups', id],
    queryFn: () => groupsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) =>
      groupsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['groups', id] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => groupsApi.joinByCode(inviteCode),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.leave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId, role }: { groupId: string; userId: string; role: 'ADMIN' | 'MEMBER' }) =>
      groupsApi.updateMemberRole(groupId, userId, role),
    onSuccess: (_data, { groupId }) => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: (_data, { groupId }) => qc.invalidateQueries({ queryKey: ['groups', groupId] }),
  });
}

export function usePublicGroups(search?: string) {
  return useQuery({
    queryKey: ['groups', 'public', search],
    queryFn: () => groupsApi.listPublic({ search }),
  });
}

export function useRegenerateInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.regenerateInvite(id),
    onSuccess: (_data, id) => qc.invalidateQueries({ queryKey: ['groups', id] }),
  });
}
