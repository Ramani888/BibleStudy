import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../api';

export function useDailyVerse() {
  return useQuery({
    queryKey: ['daily-verse'],
    queryFn: aiApi.getDailyVerse,
    staleTime: 1000 * 60 * 60 * 12, // refresh every 12 hours
  });
}
