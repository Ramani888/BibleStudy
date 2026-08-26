import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { Button, Typography } from '../ui';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

import { useTranslation } from 'react-i18next';

export function ErrorState({
  message,
  onRetry,
  style,
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Typography preset="h4" align="center" color={colors.textPrimary}>
        {t('common:status.error', 'Oops!')}
      </Typography>
      <Typography
        preset="body"
        align="center"
        color={colors.textSecondary}
        style={styles.message}
      >
        {message ?? t('common:status.error')}
      </Typography>
      {onRetry && (
        <Button label={t('common:actions.retry', 'Try Again')} variant="outline" onPress={onRetry} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  message: {
    marginTop: spacing.sm,
  },
  btn: {
    marginTop: spacing.xxl,
    minWidth: 140, // ponytail: off-grid value, no spacing token ≥ s80
  },
});
