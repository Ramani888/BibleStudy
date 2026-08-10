import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { fontWeights, layout, spacing, Theme, useTheme , palette } from '../../theme';
import { Typography } from './Typography';

type BadgeVariant = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const makeVariantMap = (
  colors: Theme['colors'],
): Record<BadgeVariant, { bg: string; text: string }> => ({
  primary: { bg: colors.accentSoft, text: palette.indigo800 },
  success: { bg: colors.successSoft, text: colors.success },
  error: { bg: colors.errorSurface, text: colors.alert },
  warning: { bg: colors.warningSurface, text: colors.warning },
  info: { bg: colors.infoSurface, text: colors.info },
  neutral: { bg: colors.gray100, text: colors.gray700 },
});

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { colors } = useTheme();
  const { bg, text } = makeVariantMap(colors)[variant];
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
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.s10,
    paddingVertical: spacing.s2,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: fontWeights.semiBold,
  },
});
