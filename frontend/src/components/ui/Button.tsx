import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, layout, shadows } from '../../theme';
import { Typography } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; labelColor: string }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      ...shadows.md,
    },
    labelColor: colors.textOnPrimary,
  },
  secondary: {
    container: { backgroundColor: colors.primarySurface },
    labelColor: colors.primaryDark,
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    labelColor: colors.primary,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    labelColor: colors.primary,
  },
  danger: {
    container: {
      backgroundColor: colors.error,
      ...shadows.md,
    },
    labelColor: colors.textOnPrimary,
  },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { container, labelColor } = variantStyles[variant];
  const height = size === 'sm' ? layout.buttonHeightSm : layout.buttonHeight;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        container,
        { height, opacity: pressed || isDisabled ? 0.65 : 1 },
        fullWidth && styles.fullWidth,
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Typography preset={size === 'sm' ? 'buttonSm' : 'button'} color={labelColor}>
          {label}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
});
