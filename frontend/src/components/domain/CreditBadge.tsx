import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';

const STAR_SIZE = 10;

interface CreditBadgeProps {
  balance: number;
}

export function CreditBadge({ balance }: CreditBadgeProps) {
  return (
    <View style={styles.pill}>
      <Icon name="star" size={STAR_SIZE} color={colors.primaryDark} />
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
});
