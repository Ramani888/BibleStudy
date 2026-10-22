import React from 'react';
import { ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { AnimatedPressable, Typography } from '../ui';
import { useTheme, spacing, radius } from '../../theme';

const BTN_H = 56; // canvas bottom primary button

interface QMButtonProps {
  label: string;
  onPress: () => void;
  /** Spinner + `loadingLabel` (falls back to `label`); taps ignored. */
  loading?: boolean;
  loadingLabel?: string;
  /** Greyed "off" look. Still pressable when `pressableWhenOff` (to surface why). */
  off?: boolean;
  pressableWhenOff?: boolean;
  style?: ViewStyle;
}

/** Quiet-morning primary button: 56px violet with soft violet drop. */
export function QMButton({ label, onPress, loading, loadingLabel, off, pressableWhenOff, style }: QMButtonProps) {
  const { qm } = useTheme();
  const disabled = loading || (off && !pressableWhenOff);
  return (
    <AnimatedPressable
      scaleTo={0.97}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        off ? { backgroundColor: qm.btnOff } : { backgroundColor: qm.violet, boxShadow: qm.btnShadow },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off || !!loading, busy: !!loading }}
    >
      {loading && <ActivityIndicator size="small" color={qm.onViolet} />}
      <Typography preset="qmButtonLg" color={off ? qm.btnOffInk : qm.onViolet}>
        {loading ? loadingLabel ?? label : label}
      </Typography>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: BTN_H, borderRadius: radius.r18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s10,
  },
});
