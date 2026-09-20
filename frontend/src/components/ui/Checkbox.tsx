import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { CheckIcon } from '../icons';
import { radius, useTheme } from '../../theme';

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

/** Square opt-in checkbox — fills with the accent + a check when selected. */
export function Checkbox({ value, onValueChange, accessibilityLabel }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.box,
        {
          borderColor: value ? colors.accent : colors.border,
          backgroundColor: value ? colors.accent : colors.transparent,
        },
        pressed && styles.pressed,
      ]}
    >
      {value && <CheckIcon size={14} color={colors.textOnAccent} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.r6,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
});
