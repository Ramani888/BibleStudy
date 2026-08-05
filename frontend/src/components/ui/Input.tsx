import React, { forwardRef, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Theme, useTheme } from '../../theme';
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Typography preset="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </Typography>
      )}

      <View style={[styles.inputRow, rest.multiline && styles.inputRowMultiline]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[styles.input, leftIcon ? styles.inputWithLeft : null, rest.multiline ? styles.inputMultiline : null, style]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secure}
          autoCapitalize="none"
          {...rest}
        />

        {isPassword ? (
          <Pressable
            style={styles.iconRight}
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

const makeStyles = ({ colors, spacing, layout, textPresets }: Theme) =>
  StyleSheet.create({
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
      borderRadius: layout.cardRadius,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing[4],
      overflow: 'hidden',
    },
    // Multiline: let the row grow with content instead of clipping to one line.
    inputRowMultiline: {
      height: undefined,
      minHeight: layout.inputHeight,
      alignItems: 'flex-start',
      paddingVertical: spacing[3],
    },
    input: {
      flex: 1,
      ...textPresets.body,
      lineHeight: undefined, // lineHeight on TextInput clips descenders (g,y,p) at the bottom
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    inputMultiline: {
      textAlignVertical: 'top',
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
