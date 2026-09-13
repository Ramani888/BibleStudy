import { QueryClient, onlineManager } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Wire React Query's connectivity to the device. Without this, RN queries think
// they're always online and fail on offline instead of pausing + resuming.
onlineManager.setEventListener(setOnline =>
  NetInfo.addEventListener(state => setOnline(!!state.isConnected)),
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 min — data considered fresh, no refetch
      gcTime: 1000 * 60 * 60 * 24, // 24 hr — must outlive the persisted cache so restored data isn't GC'd on launch
    },
  },
});

// Persist only the user's own study content — readable offline after an app restart.
// Others' content (public/friends sets) and volatile data (ai, credits) stay memory-only.
const OFFLINE_KEYS = ['sets', 'cards', 'card', 'folders'];

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister: createAsyncStoragePersister({ storage: AsyncStorage, key: '@bsp/rq-cache' }),
  maxAge: 1000 * 60 * 60 * 24 * 7, // keep a week offline
  dehydrateOptions: {
    shouldDehydrateQuery: q =>
      Array.isArray(q.queryKey) &&
      OFFLINE_KEYS.includes(q.queryKey[0] as string) &&
      q.state.status === 'success',
  },
};
