import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min — data considered fresh, no refetch
      gcTime: 1000 * 60 * 60, // 1 hr — keep evicted-screen cache so navigating back never drops to a full skeleton
    },
  },
});
