import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { spacing, useTheme } from '../../theme';
import { Button, Typography } from '../ui';

const DEFAULT_ANIMATION = require('../../assets/animations/empty.json');

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ title, subtitle, ctaLabel, onCta, icon, style }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : (
        <LottieView
          source={DEFAULT_ANIMATION}
          autoPlay
          loop
          style={styles.lottie}
        />
      )}
      <Typography preset="h4" align="center" color={colors.textPrimary}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          preset="body"
          align="center"
          color={colors.textSecondary}
          style={styles.subtitle}
        >
          {subtitle}
        </Typography>
      )}
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: spacing[3],
  },
  icon: {
    marginBottom: spacing[4],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  cta: {
    marginTop: spacing[6],
    minWidth: 160,
  },
});
