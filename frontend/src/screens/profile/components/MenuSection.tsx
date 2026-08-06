import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from '../../../components/ui';
import { layout, spacing, useTheme } from '../../../theme';

interface MenuSectionProps {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MenuSection({ label, children, style }: MenuSectionProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.section, style]}>
      {label ? (
        <Typography preset="h4" style={styles.sectionLabel}>
          {label}
        </Typography>
      ) : null}
      {children}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    section: {
      backgroundColor: colors.backgroundCard,
      marginTop: spacing[6],
      paddingHorizontal: layout.screenPaddingH,
    },
    sectionLabel: {
      paddingTop: spacing[4],
      paddingBottom: spacing[1],
    },
  });
}
