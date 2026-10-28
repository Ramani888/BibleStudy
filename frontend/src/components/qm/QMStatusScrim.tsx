import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme, spacing } from '../../theme';

/**
 * Page-coloured band behind the status bar, with a short fade under it, so content
 * scrolling up doesn't collide with the clock and icons. Render it LAST inside a
 * screen whose ScrollView starts at the very top (paddingTop: insets.top + …).
 */
export function QMStatusScrim() {
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.wrap, { height: insets.top + spacing.md }]}>
      <View style={[styles.band, { height: insets.top, backgroundColor: qm.bg }]} />
      <LinearGradient colors={[qm.bg, `${qm.bg}00`]} style={styles.fade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  band: { width: '100%' },
  fade: { flex: 1 },
});
