import React from 'react';
import { View } from 'react-native';

interface SpacerProps {
  size: number;
  horizontal?: boolean;
}

export function Spacer({ size, horizontal = false }: SpacerProps) {
  return <View style={horizontal ? { width: size } : { height: size }} />;
}
