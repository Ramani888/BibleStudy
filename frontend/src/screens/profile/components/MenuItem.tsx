import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { palette, radius, spacing, useTheme } from '../../../theme';
import { Typography } from '../../../components/ui';
import { ChevronRightIcon, type IconComponent } from '../../../components/icons';

const ICON_SIZE = 20;
const TILE_SIZE = 40;
const CHEVRON_SIZE = 18;

export const MENU_ICON_COLOR = palette.indigo500;

interface MenuItemProps {
  icon: IconComponent;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
  showChevron?: boolean;
}

export function MenuItem({
  icon: Icon,
  label,
  value,
  destructive = false,
  onPress,
  showChevron = true,
}: MenuItemProps) {
  const { colors } = useTheme();
  const labelColor = destructive ? colors.alert : colors.textPrimary;
  const tileColor = destructive ? colors.errorSurface : colors.surfaceTint;
  const iconColor = destructive ? colors.alert : MENU_ICON_COLOR;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.tile, { backgroundColor: tileColor }]}>
        <Icon size={ICON_SIZE} color={iconColor} />
      </View>
      <Typography preset="label" color={labelColor} style={styles.label}>
        {label}
      </Typography>
      {value ? (
        <Typography preset="caption" color={colors.textSecondary}>
          {value}
        </Typography>
      ) : null}
      {showChevron && (
        <ChevronRightIcon size={CHEVRON_SIZE} color={colors.textDisabled} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s17,
    paddingHorizontal: spacing.lg,
    gap: spacing.s14,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
