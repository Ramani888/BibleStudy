import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../theme';
import type { IconComponent } from '../icons';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress: () => void;
  icon?: IconComponent;
  disabled?: boolean;
}

export function FilterChip({ label, active = false, onPress, icon: Icon, disabled }: FilterChipProps) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : colors.backgroundCard,
          opacity: pressed || disabled ? 0.6 : 1,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          gap: spacing[1],
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {Icon && <Icon size={14} color={active ? colors.background : colors.textSecondary} />}
      <Typography preset="label" color={active ? colors.background : colors.textSecondary}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
});
