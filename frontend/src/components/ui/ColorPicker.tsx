import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Typography } from './Typography';

export const PRESET_COLORS = [
  '#7C3AED', '#3B82F6', '#0D9488', '#16A34A',
  '#CA8A04', '#EA580C', '#DC2626', '#DB2777',
  '#4F46E5', '#0891B2', '#65A30D', '#E11D48',
];

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  presets?: string[];
}

export function ColorPicker({ value, onChange, presets = PRESET_COLORS }: ColorPickerProps) {
  return (
    <View style={styles.grid}>
      {presets.map(color => (
        <Pressable
          key={color}
          style={[styles.swatch, { backgroundColor: color }, value === color && styles.swatchSelected]}
          onPress={() => onChange(value === color ? null : color)}
          hitSlop={4}
        >
          {value === color && (
            <Typography style={styles.check}>✓</Typography>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.background,
  },
  check: {
    color: colors.textInverse,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
});
