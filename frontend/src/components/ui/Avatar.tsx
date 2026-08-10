import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import { layout, useTheme } from '../../theme';
import { Typography } from './Typography';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: layout.avatarSm,
  md: layout.avatarMd,
  lg: layout.avatarLg,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = sizeMap[size];
  const fontSize = size === 'lg' ? 28 : size === 'md' ? 18 : 13;

  const circleStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ backgroundColor: colors.gray200 }, circleStyle as ImageStyle, style as ImageStyle]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { backgroundColor: colors.accent }, circleStyle, style]}>
      <Typography
        preset="label"
        color={colors.textOnAccent}
        style={{ fontSize, lineHeight: fontSize * 1.2 }}
      >
        {getInitials(name)}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
