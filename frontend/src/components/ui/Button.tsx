import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing } from '../../theme';
import { Typography } from './Typography';
import { triggerHaptic } from '../../utils/haptics';

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
  onPressIn,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { container, labelColor } = variantStyles[variant];
  const height = size === 'sm' ? layout.buttonHeightSm : layout.buttonHeight;

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    triggerHaptic('light');
    onPressIn?.(e);
  }, [onPressIn]);

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
      onPressIn={handlePressIn}
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
    paddingHorizontal: spacing[5],
  },
  fullWidth: {
    width: '100%',
  },
});
