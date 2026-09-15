import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureAnalytics, setAnalyticsEnabled } from '../lib/analytics';

const STORAGE_KEY = '@bsp/analytics_enabled';

interface AnalyticsState {
  /** Product-analytics opt-in. Default on; user can opt out in Settings (LGPD). */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** Apply the persisted preference on app start. */
  hydrate: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>(set => ({
  enabled: true,
  setEnabled: enabled => {
    set({ enabled });
    setAnalyticsEnabled(enabled);
    AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false').catch(() => {});
  },
  hydrate: async () => {
    // Read the preference FIRST, then configure PostHog with it — so an opted-out
    // user's client is constructed opted-out and never emits the cold-start app_open.
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    const enabled = saved !== 'false';
    set({ enabled });
    configureAnalytics({ optedOut: !enabled });
  },
}));
