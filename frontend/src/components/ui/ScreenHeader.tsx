import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BackIcon, CloseIcon } from '../icons';
import { Typography } from './Typography';
import { layout, radius, spacing, useTheme } from '../../theme';

const NAV_ICON_SIZE = 24;

interface ScreenHeaderProps {
  title?: string;
  /** Renders a back arrow on the left. */
  onBack?: () => void;
  /** Renders a close (X) on the left instead of back — use for modal screens. */
  onClose?: () => void;
  /** Right-aligned actions (icons, links). */
  right?: React.ReactNode;
  /** Show a drag-handle grabber (bottom-sheet / page-sheet style) instead of a ✕/back icon. */
  handle?: boolean;
  titleNumberOfLines?: number;
}

/** Custom in-screen header (SVG nav icon + title + actions) matching Home. */
export function ScreenHeader({ title, onBack, onClose, right, handle, titleNumberOfLines = 1 }: ScreenHeaderProps) {
  const { colors } = useTheme();

  const leading = handle ? null : onBack ? (
    <Pressable onPress={onBack} hitSlop={8} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel="Go back">
      <BackIcon size={NAV_ICON_SIZE} color={colors.textPrimary} />
    </Pressable>
  ) : onClose ? (
    <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.85 }]} accessibilityRole="button" accessibilityLabel="Close">
      <CloseIcon size={NAV_ICON_SIZE} color={colors.textPrimary} />
    </Pressable>
  ) : null;

  return (
    <View>
      {handle && <View style={[styles.grabber, { backgroundColor: colors.border }]} />}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        {leading}
        {title ? (
          <Typography preset="h4" numberOfLines={titleNumberOfLines} style={styles.title}>
            {title}
          </Typography>
        ) : (
          <View style={styles.title} />
        )}
        {right ? <View style={styles.actions}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grabber: {
    width: spacing.huge,
    height: spacing.xs,
    borderRadius: radius.r2,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    minHeight: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.sm,
  },
  navBtn: { marginLeft: -spacing.xs },
  title: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});
