import React from 'react';
import { View } from 'react-native';

interface SpacerProps {
  /** Pass a value from the spacing scale: spacing[N] */
  size: number;
  horizontal?: boolean;
}

export function Spacer({ size, horizontal = false }: SpacerProps) {
  return <View style={horizontal ? { width: size } : { height: size }} />;
}
