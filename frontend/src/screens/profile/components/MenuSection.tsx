import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Typography } from '../../../components/ui';
import { colors, fontSizes, layout, spacing } from '../../../theme';

interface MenuSectionProps {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MenuSection({ label, children, style }: MenuSectionProps) {
  return (
    <View style={[styles.section, style]}>
      <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
        {label}
      </Typography>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.background,
    marginTop: spacing[3],
    paddingHorizontal: layout.screenPaddingH,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
    letterSpacing: 1,
    fontSize: fontSizes.xs,
  },
});
