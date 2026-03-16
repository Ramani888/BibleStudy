import React from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { colors, layout, shadows, ShadowKey, spacing } from '../../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  shadow?: ShadowKey;
  padding?: number;
  style?: ViewStyle;
}

interface PressableCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  shadow?: ShadowKey;
  padding?: number;
  style?: ViewStyle;
}

/** Static card container */
export function Card({ children, shadow = 'sm', padding, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        shadows[shadow],
        padding !== undefined ? { padding } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

/** Tappable card — use for list items, set cards, folder cards, etc. */
export function PressableCard({
  children,
  shadow = 'sm',
  padding,
  style,
  ...rest
}: PressableCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        shadows[shadow],
        padding !== undefined ? { padding } : null,
        { opacity: pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.backgroundCard,
    borderRadius: layout.cardRadius,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
});
