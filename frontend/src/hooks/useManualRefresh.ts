import { useCallback, useState } from 'react';

/**
 * Drives a pull-to-refresh spinner that shows ONLY during a user-initiated pull —
 * never during React Query's background refetches (invalidation, focus, staleness).
 *
 * Binding `RefreshControl` straight to `isRefetching` flashes the spinner whenever a
 * mutation invalidates the query (e.g. adding a card refetches the sets list), even
 * though the user never pulled. Route the pull through this instead.
 *
 * Pass the query's `refetch` (compose multiple with `() => Promise.all([a(), b()])`).
 */
export function useManualRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
}
