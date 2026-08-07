import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { IconComponent } from '../icons';
import { layout, useTheme } from '../../theme';

interface AccentIconProps {
  icon: IconComponent;
  /** Entity accent color; falls back to the theme primary when null/undefined. */
  color?: string | null;
  size?: number;
}

/** Leading colored chip — filled with the entity's accent color, white glyph. */
export function AccentIcon({ icon: Icon, color, size = 44 }: AccentIconProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { width: size, height: size, backgroundColor: color ?? colors.primary }]}>
      <Icon size={Math.round(size * 0.5)} color={colors.textOnPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: layout.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
