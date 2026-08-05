import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { textPresets, TextPreset, useTheme } from '../../theme';

export interface TypographyProps extends TextProps {
  preset?: TextPreset;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export function Typography({
  preset = 'body',
  color,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  const { colors } = useTheme();
  // Default to the themed primary text color so text is dark-mode aware.
  const resolved = color ?? colors.textPrimary;
  return (
    <Text
      style={[textPresets[preset], { color: resolved }, align ? { textAlign: align } : null, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
