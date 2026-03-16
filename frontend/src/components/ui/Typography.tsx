import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, textPresets, TextPreset } from '../../theme';

interface TypographyProps extends TextProps {
  preset?: TextPreset;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export function Typography({
  preset = 'body',
  color = colors.textPrimary,
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  return (
    <Text
      style={[textPresets[preset], { color }, align ? { textAlign: align } : null, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
