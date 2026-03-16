import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../../theme';
import { Typography } from '../../../components/ui';

interface MenuItemProps {
  emoji: string;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
  showChevron?: boolean;
}

export function MenuItem({
  emoji,
  label,
  value,
  destructive = false,
  onPress,
  showChevron = true,
}: MenuItemProps) {
  const labelColor = destructive ? colors.error : colors.textPrimary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
        <Typography style={styles.emoji}>{emoji}</Typography>
      </View>
      <Typography preset="body" color={labelColor} style={styles.label}>
        {label}
      </Typography>
      {value ? (
        <Typography preset="bodySm" color={colors.textSecondary}>
          {value}
        </Typography>
      ) : null}
      {showChevron && (
        <Typography preset="body" color={colors.textDisabled}>›</Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: colors.errorSurface,
  },
  emoji: { fontSize: 18 },
  label: { flex: 1 },
});
