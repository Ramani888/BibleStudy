import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { spacing, layout } from './spacing';
import { textPresets } from './typography';
import { useThemeStore } from './themeStore';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  layout: typeof layout;
  textPresets: typeof textPresets;
}

/** Resolve the active theme name from the user preference + OS color scheme. */
export function useThemeName(): ThemeName {
  const mode = useThemeStore(s => s.mode);
  const system = useColorScheme();
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

/** The single hook a migrated screen uses to read design tokens (dark-aware). */
export function useTheme(): Theme {
  const name = useThemeName();
  return useMemo(
    () => ({
      name,
      colors: name === 'dark' ? darkColors : lightColors,
      spacing,
      layout,
      textPresets,
    }),
    [name],
  );
}
