import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, useTheme } from '../../theme';
import { Button, Typography } from '../ui';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <Typography preset="h4" align="center" color={colors.textPrimary}>
        Oops!
      </Typography>
      <Typography
        preset="body"
        align="center"
        color={colors.textSecondary}
        style={styles.message}
      >
        {message}
      </Typography>
      {onRetry && (
        <Button label="Try Again" variant="outline" onPress={onRetry} style={styles.btn} />
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
    minWidth: 140,
  },
});
