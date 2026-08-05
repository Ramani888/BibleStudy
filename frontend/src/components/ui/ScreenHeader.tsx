import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BackIcon, CloseIcon } from '../icons';
import { Typography } from './Typography';
import { Theme, useTheme } from '../../theme';

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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const leading = handle ? null : onBack ? (
    <Pressable onPress={onBack} hitSlop={8} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Go back">
      <BackIcon size={NAV_ICON_SIZE} color={colors.textPrimary} />
    </Pressable>
  ) : onClose ? (
    <Pressable onPress={onClose} hitSlop={8} style={styles.navBtn} accessibilityRole="button" accessibilityLabel="Close">
      <CloseIcon size={NAV_ICON_SIZE} color={colors.textPrimary} />
    </Pressable>
  ) : null;

  return (
    <View>
      {handle && <View style={styles.grabber} />}
      <View style={styles.header}>
        {leading}
        {title ? (
          <Typography preset="h3" numberOfLines={titleNumberOfLines} style={styles.title}>
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    grabber: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginTop: spacing[2],
    },
    header: {
      minHeight: layout.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[2],
      backgroundColor: colors.background,
    },
    navBtn: { marginLeft: -spacing[1] },
    title: { flex: 1 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  });
