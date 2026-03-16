import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, layout, spacing, textPresets } from '../../theme';
import { Typography } from './Typography';

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
  const [secure, setSecure] = useState(isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.borderFocus
    : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography preset="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </Typography>
      )}

      <View style={[styles.inputRow, { borderColor }]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, style]}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={secure}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...rest}
        />

        {isPassword ? (
          <Pressable
            style={styles.iconRight}
            onPress={() => setSecure(s => !s)}
            hitSlop={8}
          >
            <Typography preset="label" color={colors.textSecondary}>
              {secure ? 'Show' : 'Hide'}
            </Typography>
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Typography preset="caption" color={colors.error} style={styles.hint}>
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
    marginBottom: spacing[1.5],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing[4],
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    ...textPresets.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  inputWithLeft: {
    paddingLeft: spacing[2],
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
  hint: {
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});
