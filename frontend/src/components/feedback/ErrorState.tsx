import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';
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
    paddingHorizontal: spacing[8],
  },
  message: {
    marginTop: spacing[2],
  },
  btn: {
    marginTop: spacing[6],
    minWidth: 140,
  },
});
