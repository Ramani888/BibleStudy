import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends.api';

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: friendsApi.list,
  });
}

export function useFriendRequests(type: 'incoming' | 'outgoing' = 'incoming') {
  return useQuery({
    queryKey: ['friends', 'requests', type],
    queryFn: () => friendsApi.listRequests(type),
  });
}

export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => friendsApi.searchUsers(q),
    enabled: q.trim().length > 1,
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['friends', 'blocked'],
    queryFn: friendsApi.listBlocked,
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) => friendsApi.sendRequest(receiverId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => friendsApi.acceptRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useRejectFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => friendsApi.rejectRequest(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', 'requests', 'incoming'] }),
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => friendsApi.remove(friendId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.block(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.unblock(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', 'blocked'] }),
  });
}
