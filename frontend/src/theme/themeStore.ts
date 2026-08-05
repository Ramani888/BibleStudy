import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@bsp/theme_mode';

interface ThemeState {
  /** User preference. 'system' follows the OS color scheme. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Load the persisted preference on app start. */
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>(set => ({
  mode: 'system',
  setMode: mode => {
    set({ mode });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  },
  hydrate: async () => {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ mode: saved });
    }
  },
}));
