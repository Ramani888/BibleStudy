import { useMutation } from '@tanstack/react-query';
import { usersApi } from '../api';
import { useAuthStore } from '../store';
import { storage } from '../utils/storage';
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types';

export function useUpdateProfile() {
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateProfile(payload),
    onSuccess: user => {
      updateUser(user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersApi.changePassword(payload),
    // The server revokes every session on a password change and hands this device a new one.
    onSuccess: ({ accessToken, refreshToken }) => storage.setTokens(accessToken, refreshToken),
  });
}

