import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { Typography } from './Typography';
import { MoreVerticalIcon } from '../icons';
import { Theme, useTheme } from '../../theme';

const MENU_ICON_SIZE = 20;

interface ListCardProps {
  /** Leading visual — usually an <AccentIcon />. */
  leading?: React.ReactNode;
  title: string;
  /** Right-aligned meta, shown beside the ⋮ menu (e.g. a visibility label). */
  meta?: React.ReactNode;
  subtitle?: string;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

/** Reusable list row: leading · title/subtitle · (meta + ⋮ menu). */
export function ListCard({ leading, title, meta, subtitle, onPress, onLongPress, onMenuPress }: ListCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  return (
    <AnimatedPressable style={styles.card} onPress={onPress} onLongPress={onLongPress} accessibilityRole="button">
      {leading}
      <View style={styles.content}>
        <Typography preset="label" numberOfLines={1}>{title}</Typography>
        {subtitle ? (
          <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>{subtitle}</Typography>
        ) : null}
      </View>
      {(meta || onMenuPress) && (
        <View style={styles.trailing}>
          {meta}
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

const makeStyles = ({ colors, spacing }: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      backgroundColor: colors.backgroundCard,
      borderRadius: 14,
      padding: spacing[4],
    },
    content: { flex: 1, gap: spacing[0.5] },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  });
