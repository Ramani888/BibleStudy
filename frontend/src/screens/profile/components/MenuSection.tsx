import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from '../../../components/ui';
import { CARD_FILL_LIGHT, fontSize, layout, radius, spacing, useTheme } from '../../../theme';

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
          isDark
            ? { backgroundColor: theme.colors.surface }
            : [styles.lightCard, { borderColor: theme.colors.divider }],
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
    fontSize: fontSize.caption,
    letterSpacing: 1,
    marginBottom: spacing.s10,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  lightCard: {
    backgroundColor: CARD_FILL_LIGHT,
    borderWidth: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.s70,
  },
});
