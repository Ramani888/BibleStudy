import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersApi.getUserById(userId),
    enabled: !!userId,
  });
}
