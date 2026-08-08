import { useQuery } from '@tanstack/react-query';
import { achievementsApi } from '../api';

// The GET runs a server-side unlock check, so refetch on mount to catch newly
// earned achievements (and the credit grants that come with them).
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementsApi.getAll(),
    staleTime: 30_000,
  });
}
