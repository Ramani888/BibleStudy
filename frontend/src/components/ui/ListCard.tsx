import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';
import { MoreVerticalIcon } from '../icons';
import { layout, spacing, useTheme } from '../../theme';

const MENU_ICON_SIZE = 20;

interface ListCardProps {
  /** Leading visual — an <AccentIcon />, <Avatar />, or any node. */
  leading?: React.ReactNode;
  title: string;
  /** Right-aligned meta, shown beside the ⋮ menu / trailing (e.g. a visibility label). */
  meta?: React.ReactNode;
  subtitle?: string;
  /** Any right-side element (button, chevron, icon, count). Rendered after meta. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

/** Reusable list row: leading · title/subtitle · (meta + trailing + ⋮ menu). */
export function ListCard({ leading, title, meta, subtitle, trailing, onPress, onLongPress, onMenuPress }: ListCardProps) {
  const { colors } = useTheme();

  return (
    <AnimatedPressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button">
      {leading}
      <View style={styles.content}>
        <Typography preset="label" numberOfLines={1}>{title}</Typography>
        {subtitle ? (
          <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>{subtitle}</Typography>
        ) : null}
      </View>
      {(meta || trailing || onMenuPress) && (
        <View style={styles.trailing}>
          {meta}
          {trailing}
          {onMenuPress && (
            <Pressable onPress={onMenuPress} hitSlop={8}>
              <MoreVerticalIcon size={MENU_ICON_SIZE} color={colors.textDisabled} />
            </Pressable>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: layout.cardRadiusSm,
    padding: spacing.lg,
  },
  content: { flex: 1, gap: spacing.s2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
