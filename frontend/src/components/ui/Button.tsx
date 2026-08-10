import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { layout, spacing, Theme, useTheme , palette } from '../../theme';
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

const makeVariantStyles = (
  colors: Theme['colors'],
): Record<ButtonVariant, { container: ViewStyle; labelColor: string }> => ({
  primary: {
    container: { backgroundColor: colors.accent },
    labelColor: colors.textOnAccent,
  },
  secondary: {
    container: { backgroundColor: colors.accentSoft },
    labelColor: palette.indigo800,
  },
  outline: {
    container: {
      backgroundColor: colors.transparent,
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    labelColor: colors.accent,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    labelColor: colors.accent,
  },
  danger: {
    container: { backgroundColor: colors.alert },
    labelColor: colors.textOnAccent,
  },
});

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
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const { container, labelColor } = makeVariantStyles(colors)[variant];
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
    borderRadius: layout.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
});
