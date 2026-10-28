import { useContext, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

/**
 * Bottom space a tab-hosted screen must leave free, because the floating tab bar is drawn
 * OVER the content (content scrolls behind it). Add it to scroll content paddingBottom and
 * to any footer pinned to the bottom. 0 outside the tabs, when the bar is hidden
 * (full-screen forms) and while the keyboard is open (the keyboard covers the bar).
 */
export function useTabBarSpace(): number {
  const height = useContext(BottomTabBarHeightContext) ?? 0;
  const [keyboard, setKeyboard] = useState(false);

  useEffect(() => {
    // Floating keyboards report height <= 0 and don't cover the bar — keep the space then.
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboard(e.endCoordinates.height > 0));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return keyboard ? 0 : height;
}
