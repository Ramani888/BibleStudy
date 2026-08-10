import React from 'react';
import { Platform, Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { layout, spacing, useTheme } from '../../theme';

type ShadowLevel = 'none' | 'sm' | 'md' | 'lg' | 'xl';

const shadow = (elevation: number, opacity: number, radius: number, offsetY: number) =>
  Platform.select({
    ios:     { shadowColor: '#000', shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: offsetY } },
    android: { elevation },
    default: {},
  });

const shadows: Record<ShadowLevel, object> = {
  none: {},
  sm:   shadow(2,  0.06, 4,  1),
  md:   shadow(4,  0.08, 8,  2),
  lg:   shadow(8,  0.10, 16, 4),
  xl:   shadow(12, 0.12, 24, 6),
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
  const { colors } = useTheme();
  return (
    <View style={[styles.base, { backgroundColor: colors.surface, borderColor: colors.border }, shadows[s], padding !== undefined ? { padding } : null, style]} {...rest}>
      {children}
    </View>
  );
}

export function PressableCard({ children, shadow: s = 'none', padding, style, ...rest }: PressableCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={({ pressed }) => [styles.base, { backgroundColor: colors.surface, borderColor: colors.border }, shadows[s], padding !== undefined ? { padding } : null, { opacity: pressed ? 0.85 : 1 }, style]}
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
