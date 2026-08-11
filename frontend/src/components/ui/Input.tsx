import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { layout, spacing, textPresets, useTheme } from '../../theme';
import { Typography } from './Typography';

const EYE_SIZE = 20;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Adds a show/hide toggle — automatically sets secureTextEntry */
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}, ref) {
  const { colors } = useTheme();
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography preset="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </Typography>
      )}

      <View style={[styles.inputRow, { backgroundColor: colors.surfaceMuted }, rest.multiline && styles.inputRowMultiline]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.textPrimary }, leftIcon ? styles.inputWithLeft : null, rest.multiline ? styles.inputMultiline : null, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          autoCapitalize="none"
          {...rest}
        />

        {isPassword ? (
          <Pressable
            style={({ pressed }) => [styles.iconRight, pressed && { opacity: 0.85 }]}
            onPress={() => setSecure(s => !s)}
            hitSlop={8}
          >
            <Icon
              name={secure ? 'eye-outline' : 'eye-off-outline'}
              size={EYE_SIZE}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Typography preset="caption" color={colors.alert} style={styles.hint}>
          {error}
        </Typography>
      ) : hint ? (
        <Typography preset="caption" color={colors.textSecondary} style={styles.hint}>
          {hint}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.s6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  // Multiline: let the row grow with content instead of clipping to one line.
  inputRowMultiline: {
    height: undefined,
    minHeight: layout.inputHeight,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  input: {
    flex: 1,
    ...textPresets.body,
    lineHeight: undefined, // lineHeight on TextInput clips descenders (g,y,p) at the bottom
    paddingVertical: 0,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  inputWithLeft: {
    paddingLeft: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  hint: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
