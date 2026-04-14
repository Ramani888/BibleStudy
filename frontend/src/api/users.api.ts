import { apiDelete, apiGet, apiPut } from './client';
import type { ChangePasswordPayload, UpdateProfilePayload, User } from '../types';
import type { UserPublicProfile } from '../types/user.types';


export const usersApi = {
  getProfile: () =>
    apiGet<User>('/users/profile'),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiPut<User>('/users/profile', payload),

  changePassword: (payload: ChangePasswordPayload) =>
    apiPut<{ message: string }>('/users/change-password', payload),

  deleteAccount: () =>
    apiDelete('/users/account'),

  getUserById: (userId: string) =>
    apiGet<UserPublicProfile>(`/users/${userId}`),
};
