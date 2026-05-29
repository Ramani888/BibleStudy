import { useSets } from './useSets';

export function useSetStats() {
  const query = useSets();
  const sets = query.data;

  return {
    ...query,
    data: sets
      ? {
          totalSets: sets.length,
          totalCards: sets.reduce((sum, s) => sum + (s._count?.cards ?? 0), 0),
        }
      : undefined,
  };
}
