import { useQuery } from '@tanstack/react-query';
import { setsApi } from '../api';

export function useSetStats() {
  return useQuery({
    queryKey: ['sets', 'stats'],
    queryFn: async () => {
      const sets = await setsApi.list();
      return {
        totalSets: sets.length,
        totalCards: sets.reduce((sum, s) => sum + (s._count?.cards ?? 0), 0),
      };
    },
  });
}
