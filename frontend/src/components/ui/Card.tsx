import React from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { CARD_FILL_LIGHT, layout, spacing, useTheme } from '../../theme';

type ShadowLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const shadows: Record<ShadowLevel, object> = {
  none: {},
  sm:   {},
  md:   {},
  lg:   {},
  xl:   {},
};

interface CardProps extends ViewProps {
  children: React.ReactNode;
  shadow?: ShadowLevel;
  padding?: number;
  style?: ViewStyle;
}

interface PressableCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  shadow?: ShadowLevel;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, shadow: s = 'none', padding, style, ...rest }: CardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  return (
    <View style={[styles.base, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }, !isDark ? shadows[s] : null, padding !== undefined ? { padding } : null, style]} {...rest}>
      {children}
    </View>
  );
}

export function PressableCard({ children, shadow: s = 'none', padding, style, ...rest }: PressableCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  return (
    <Pressable
      style={({ pressed }) => [styles.base, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }, !isDark ? shadows[s] : null, padding !== undefined ? { padding } : null, { opacity: pressed ? 0.7 : 1 }, style]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: layout.cardRadius,
    padding: spacing.lg,
    borderWidth: 1,
  },
});
