import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { Typography } from '../ui';
import { QMButton } from '../qm';

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
  const { qm } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Typography preset="h4" align="center" color={qm.ink}>
        {t('common:status.error', 'Oops!')}
      </Typography>
      <Typography
        preset="body"
        align="center"
        color={qm.muted}
        style={styles.message}
      >
        {message ?? t('common:status.error')}
      </Typography>
      {onRetry && (
        <QMButton label={t('common:actions.retry', 'Try Again')} onPress={onRetry} style={styles.btn} />
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
