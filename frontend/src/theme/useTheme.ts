import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { darkColors, lightColors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, textPresets } from './typography';
import { Theme, ThemeName } from './types';
import { useThemeStore } from './themeStore';
import { layout } from '../constants/layout';

export type { ThemeName, Theme };

export function useThemeName(): ThemeName {
  const mode = useThemeStore(s => s.mode);
  const system = useColorScheme();
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}

export function useTheme(): Theme {
  const name = useThemeName();
  return useMemo(
    () => ({
      name,
      colors:     name === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      textPresets,
      layout,
    }),
    [name],
  );
}
