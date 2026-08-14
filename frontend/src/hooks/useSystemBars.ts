import { useEffect } from 'react';
import { Platform } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useTheme } from '../theme';

/**
 * Keeps the Android bottom navigation bar in sync with the app theme.
 * iOS has no settable navigation bar — this is a no-op there.
 * Top status bar is handled by <StatusBar> in App.tsx.
 */
export function useSystemBars(color?: string): void {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const barColor = color ?? theme.colors.bottomBar;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemNavigationBar.setNavigationColor(
      barColor,
      isDark ? 'light' : 'dark',
      'navigation',
    ).catch(() => {});
  }, [barColor, isDark]);
}
