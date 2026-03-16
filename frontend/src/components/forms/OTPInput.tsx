import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fontSizes, fontWeights, spacing } from '../../theme';
import { Typography } from '../ui/Typography';

const OTP_LENGTH = 6;

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);

  const digits = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').replace(/ /g, '');
    onChange(newValue);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join('').replace(/ /g, ''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const isFocused = focused === i;
          const hasValue = !!digits[i]?.trim();
          return (
            <TextInput
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                hasValue && styles.boxFilled,
                !!error && styles.boxError,
              ]}
              value={digits[i]?.trim() || ''}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              onFocus={() => setFocused(i)}
              onBlur={() => setFocused(null)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
            />
          );
        })}
      </View>
      {error && (
        <Typography preset="caption" color={colors.error} style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
    justifyContent: 'center',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  boxFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.background,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  boxError: {
    borderColor: colors.error,
  },
  error: {
    marginTop: spacing[1.5],
    textAlign: 'center',
  },
});
