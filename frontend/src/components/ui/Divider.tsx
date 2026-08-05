import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../theme';

interface DividerProps {
  marginV?: number;
  color?: string;
  style?: ViewStyle;
}

export function Divider({ marginV = spacing[4], color, style }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.divider,
        { marginVertical: marginV, backgroundColor: color ?? colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
});
