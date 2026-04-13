import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Friendship, FriendRequest, BlockedUser, UserProfile } from '../types/friends.types';

const friendsApi = {
  list:          ()                                    => apiGet<Friendship[]>('/friends'),
  listRequests:  (type: 'incoming' | 'outgoing')       => apiGet<FriendRequest[]>('/friends/requests', { type }),
  sendRequest:   (receiverId: string)                  => apiPost<FriendRequest>('/friends/request', { receiverId }),
  acceptRequest: (requestId: string)                   => apiPut<{ message: string }>(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId: string)                   => apiPut<{ message: string }>(`/friends/request/${requestId}/reject`),
  remove:        (friendId: string)                    => apiDelete<{ message: string }>(`/friends/${friendId}`),
  block:         (userId: string)                      => apiPost<{ message: string }>(`/friends/block/${userId}`),
  unblock:       (userId: string)                      => apiDelete<{ message: string }>(`/friends/block/${userId}`),
  listBlocked:   ()                                    => apiGet<BlockedUser[]>('/friends/blocked'),
  searchUsers:   (q: string)                           => apiGet<UserProfile[]>('/friends/search', { q }),
};

export { friendsApi };
