import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { fontSizes, fontWeights, layout, spacing, Theme, useTheme } from '../../theme';
import { Typography } from '../ui/Typography';

const OTP_LENGTH = 6;
const OTP_BOX_WIDTH = 48;
const OTP_BOX_HEIGHT = 56;

interface OTPInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const theme = useTheme();
  const { colors } = theme;
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
                { borderColor: colors.border, backgroundColor: colors.backgroundSecondary, color: colors.textPrimary },
                isFocused && { borderColor: colors.borderFocus, backgroundColor: colors.background },
                hasValue && { borderColor: colors.primary, backgroundColor: colors.primarySurface },
                !!error && { borderColor: colors.error },
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
    width: OTP_BOX_WIDTH,
    height: OTP_BOX_HEIGHT,
    borderRadius: layout.cardRadius,
    borderWidth: 1.5,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  error: {
    marginTop: spacing[1.5],
    textAlign: 'center',
  },
});
