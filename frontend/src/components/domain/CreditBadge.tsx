import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';

interface CreditBadgeProps {
  balance: number;
}

export function CreditBadge({ balance }: CreditBadgeProps) {
  return (
    <View style={styles.pill}>
      <Typography preset="caption" color={colors.primaryDark} style={styles.icon}>
        ✦
      </Typography>
      <Typography preset="label" color={colors.primaryDark}>
        {balance}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primarySurface,
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  icon: {
    fontSize: 10,
  },
});
