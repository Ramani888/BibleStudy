import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { layout, spacing, useTheme } from '../../theme';
import { Typography } from '../ui/Typography';

const STAR_SIZE = 10;

interface CreditBadgeProps {
  balance: number;
}

export function CreditBadge({ balance }: CreditBadgeProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.primarySurface, borderColor: colors.primaryLight }]}>
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
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
  },
});
