import { useEffect } from 'react';
import { Platform } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useTheme } from '../theme';

/**
 * Keeps the Android system navigation bar in sync with the in-app theme.
 * Sets the OS nav bar to `bottomBar` (same fill as the tab bar) and flips
 * button icons for contrast. No-op on iOS.
 */
export function useSystemBars(): void {
  const theme = useTheme();
  const navColor = theme.colors.bottomBar;
  const isDark = theme.name === 'dark';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemNavigationBar.setNavigationColor(
      navColor,
      isDark ? 'light' : 'dark',
      'navigation',
    ).catch(() => {});
  }, [navColor, isDark]);
}
