import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
import { Typography } from './Typography';

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primarySurface, text: colors.primaryDark },
  success: { bg: colors.successSurface, text: colors.success },
  error: { bg: colors.errorSurface, text: colors.error },
  warning: { bg: colors.warningSurface, text: colors.warning },
  info: { bg: colors.infoSurface, text: colors.info },
  neutral: { bg: colors.gray100, text: colors.gray700 },
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { bg, text } = variantMap[variant];
  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      <Typography preset="caption" color={text} style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
