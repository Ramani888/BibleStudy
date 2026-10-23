import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, FadeIn,
} from 'react-native-reanimated';
import { Typography } from '../ui';
import { useTheme, spacing, textPresets } from '../../theme';

const LEN = 6;
const SIZES = { lg: { h: 58, r: 14, font: 26 }, md: { h: 52, r: 13, font: 23 } } as const; // canvas Verify / Reset

export type CodeStatus = 'idle' | 'ok' | 'bad';

function Caret({ color }: { color: string }) {
  const o = useSharedValue(1);
  useEffect(() => { o.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 0 }), withTiming(0, { duration: 500 })), -1); }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.caret, { backgroundColor: color }, style]} />;
}

/**
 * Six code boxes over one hidden numeric input (keeps paste + SMS/email autofill).
 * `status` paints all boxes green (ok) or red with a shake (bad).
 */
export function QMCodeInput({ value, onChange, status = 'idle', size = 'lg', label, autoFocus }: {
  value: string; onChange: (v: string) => void; status?: CodeStatus; size?: keyof typeof SIZES; label: string; autoFocus?: boolean;
}) {
  const { qm } = useTheme();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const dims = SIZES[size];
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  // Focus once the screen has finished sliding in. A TextInput `autoFocus` that opens the
  // keyboard mid-push froze the native-stack transition on Android until the next touch
  // (Register → Verify looked stuck after a successful sign-up).
  useEffect(() => {
    if (!autoFocus) return;
    return navigation.addListener('transitionEnd', e => {
      if (!e.data.closing) ref.current?.focus();
    });
  }, [autoFocus, navigation]);

  useEffect(() => {
    if (status !== 'bad') return;
    shake.value = withSequence(
      withTiming(-6, { duration: 70 }), withTiming(6, { duration: 70 }), withTiming(-4, { duration: 70 }),
      withTiming(3, { duration: 70 }), withTiming(0, { duration: 70 }),
    );
  }, [status, shake]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={label} accessibilityHint={`${value.length}/${LEN}`}>
      <Animated.View style={[styles.row, shakeStyle]}>
        {Array.from({ length: LEN }, (_, i) => {
          const d = value[i];
          const active = focused && i === value.length && status === 'idle';
          const border = status === 'ok' ? qm.leaf : status === 'bad' ? qm.error : active ? qm.violet : qm.line;
          const bg = status === 'ok' ? qm.leafBg : status === 'bad' ? qm.errorBg : qm.surface;
          return (
            <View
              key={i}
              style={[
                styles.box,
                { height: dims.h, borderRadius: dims.r, borderColor: border, backgroundColor: bg },
                active && { boxShadow: qm.focusRing },
              ]}
            >
              {d ? (
                <Animated.View entering={FadeIn.duration(250)}>
                  <Typography preset="qmTitle" color={status === 'ok' ? qm.leaf : qm.ink} style={{ fontSize: dims.font, lineHeight: dims.font + 6 }}>{d}</Typography>
                </Animated.View>
              ) : active ? <Caret color={qm.violet} /> : null}
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={v => onChange(v.replace(/[^0-9]/g, '').slice(0, LEN))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LEN}
        caretHidden
        style={styles.hidden}
        accessibilityLabel={label}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  box: { flex: 1, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  caret: { width: 2, height: spacing.xxl, borderRadius: 1 },
  // Off-screen but focusable: keeps the OS keyboard, paste and one-time-code autofill.
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1, ...textPresets.qmInput },
});
