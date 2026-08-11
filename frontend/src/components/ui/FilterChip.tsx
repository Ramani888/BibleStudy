import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { layout, spacing, useTheme } from '../../theme';
import type { IconComponent } from '../icons';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconComponent;
  disabled?: boolean;
}

export function FilterChip({ label, active = false, onPress, icon: Icon, disabled }: FilterChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? colors.accent : colors.surface,
          opacity: pressed || disabled ? 0.6 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {Icon && <Icon size={14} color={active ? colors.textOnAccent : colors.textSecondary} />}
      <Typography preset="label" color={active ? colors.textOnAccent : colors.textSecondary}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: layout.pillRadius,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
});
