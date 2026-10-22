import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Typography } from '../ui';
import { EyeIcon, EyeOffIcon } from '../icons';
import { useTheme, spacing, radius, textPresets } from '../../theme';
import { useTranslation } from 'react-i18next';

const FIELD_H = 52; // canvas field height

export interface QMInputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Adds a show/hide toggle and starts hidden. */
  isPassword?: boolean;
  /** Muted text after the label, e.g. "(optional)". */
  optional?: string;
  /** Right-aligned muted text on the label row, e.g. "12 / 200". */
  counter?: string;
  /** Box fill (forms inside sheets use the page bg). */
  fill?: string;
}

/** Quiet-morning text field: label above, 52px box, violet focus ring, inline error. */
export const QMInput = forwardRef<TextInput, QMInputProps>(function QMInput(
  { label, error, isPassword = false, optional, counter, fill, onFocus, onBlur, style, multiline, ...rest },
  ref,
) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);
  const borderColor = focused ? qm.violet : error ? qm.error : qm.line;

  return (
    <View style={styles.wrap}>
      {(label || counter) && (
        <View style={styles.labelRow}>
          <Typography preset="qmFieldLabel" color={qm.ink}>
            {label}
            {optional ? <Typography preset="qmBody" color={qm.muted}>{` ${optional}`}</Typography> : null}
          </Typography>
          {counter ? <Typography preset="qmBody" color={qm.muted}>{counter}</Typography> : null}
        </View>
      )}
      <View
        style={[
          styles.box,
          multiline && styles.boxMulti,
          { backgroundColor: fill ?? qm.surface, borderColor },
          focused && { boxShadow: qm.focusRing },
          isPassword && styles.boxWithEye,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, multiline && styles.inputMulti, { color: qm.ink }, style]}
          multiline={multiline}
          placeholderTextColor={qm.muted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          onFocus={e => { setFocused(true); onFocus?.(e); }}
          onBlur={e => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden(h => !h)}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('showPassword', 'Show password') : t('hidePassword', 'Hide password')}
          >
            {hidden ? <EyeIcon size={20} color={qm.muted} /> : <EyeOffIcon size={20} color={qm.muted} />}
          </Pressable>
        )}
      </View>
      {error ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <Typography preset="qmError" color={qm.error} accessibilityRole="alert">{error}</Typography>
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.s6 },
  box: {
    flexDirection: 'row', alignItems: 'center',
    height: FIELD_H, paddingHorizontal: spacing.s14,
    borderRadius: radius.r12 + 2, borderWidth: 1, // ponytail: canvas 14px field radius
  },
  boxWithEye: { paddingRight: spacing.s6 },
  boxMulti: { height: undefined, minHeight: FIELD_H, alignItems: 'stretch', paddingVertical: spacing.md },
  inputMulti: { textAlignVertical: 'top', lineHeight: 23 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  input: {
    flex: 1, minWidth: 0, paddingVertical: 0,
    ...textPresets.qmInput,
  },
  eye: { width: spacing.huge, height: spacing.huge, alignItems: 'center', justifyContent: 'center' },
});
