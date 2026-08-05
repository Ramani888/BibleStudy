import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { shadows, ShadowKey, Theme, useTheme } from '../../theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  shadow?: ShadowKey;
  /** Pass a value from the spacing scale: spacing[N] */
  padding?: number;
  style?: ViewStyle;
}

interface PressableCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  shadow?: ShadowKey;
  /** Pass a value from the spacing scale: spacing[N] */
  padding?: number;
  style?: ViewStyle;
}

/** Static card container */
export function Card({ children, shadow = 'none', padding, style, ...rest }: CardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
  shadow = 'none',
  padding,
  style,
  ...rest
}: PressableCardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.backgroundCard,
      borderRadius: layout.cardRadius,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
