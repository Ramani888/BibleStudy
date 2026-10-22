import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Typography } from '../ui';
import { useTheme, spacing, radius } from '../../theme';

/** Soft inline message — `info` (lilac) or `error` (warm red). Replaces toasts on forms. */
export function QMBanner({ tone = 'info', children, style }: { tone?: 'info' | 'error'; children: React.ReactNode; style?: ViewStyle }) {
  const { qm } = useTheme();
  const bg = tone === 'error' ? qm.errorBg : qm.lilac;
  const ink = tone === 'error' ? qm.error : qm.lilacInk;
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14)}
      style={[styles.banner, { backgroundColor: bg }, style]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Typography preset="qmBody" color={ink}>{children}</Typography>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.md },
});
