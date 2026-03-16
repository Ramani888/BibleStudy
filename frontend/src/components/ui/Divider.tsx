import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface DividerProps {
  marginV?: number;
  color?: string;
  style?: ViewStyle;
}

export function Divider({
  marginV = spacing[4],
  color = colors.border,
  style,
}: DividerProps) {
  return (
    <View
      style={[styles.divider, { marginVertical: marginV, backgroundColor: color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
});
