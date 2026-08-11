import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from '../../../components/ui';
import { fontSizes, layout, radius, spacing, useTheme } from '../../../theme';

interface MenuSectionProps {
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function MenuSection({ label, children, style }: MenuSectionProps) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const rows = React.Children.toArray(children);

  return (
    <View style={[styles.group, style]}>
      {label ? (
        <Typography
          preset="caption"
          color={theme.colors.textSecondary}
          style={styles.title}
        >
          {label.toUpperCase()}
        </Typography>
      ) : null}
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? theme.colors.chipIdle : theme.colors.surface },
        ]}
      >
        {rows.map((child, i) => (
          <View key={i}>
            {i > 0 && (
              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
            )}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: spacing.xxl,
    marginHorizontal: layout.screenPaddingH,
  },
  title: {
    fontSize: fontSizes.sm,
    letterSpacing: 1,
    marginBottom: spacing.s10,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.s70,
  },
});
