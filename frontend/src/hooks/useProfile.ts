import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api';
import { useAuthStore } from '../store';
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types';

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateProfile(payload),
    onSuccess: user => {
      updateUser(user);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersApi.changePassword(payload),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: usersApi.deleteAccount,
  });
}
