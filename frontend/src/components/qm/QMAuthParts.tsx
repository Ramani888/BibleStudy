import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Typography } from '../ui';
import { useTheme, spacing, radius } from '../../theme';

const SEAL = 84; // canvas icon tile

/** 84px lilac tile holding a hero icon (Verify / Forgot). */
export function QMIconSeal({ children }: { children: React.ReactNode }) {
  const { qm } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[styles.seal, { backgroundColor: qm.lilac }]}>
      {children}
    </Animated.View>
  );
}

/** Live password rules (mirror backend: 8+ chars, 1 capital, 1 number). */
export function QMPasswordRules({ password, failed }: { password: string; failed?: boolean }) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const rules = [
    { ok: password.length >= 8, label: t('ruleLength') },
    { ok: /[A-Z]/.test(password), label: t('ruleCapital') },
    { ok: /[0-9]/.test(password), label: t('ruleNumber') },
  ];
  return (
    <View style={styles.rules} accessibilityLiveRegion="polite">
      {rules.map(r => {
        const color = r.ok ? qm.leaf : failed ? qm.error : qm.muted;
        return (
          <View key={r.label} style={styles.rule}>
            {r.ok ? (
              <Animated.View key="ok" entering={FadeIn.duration(250)}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill={qm.leaf} />
                  <Path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke={qm.onViolet} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Animated.View>
            ) : (
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Circle cx={12} cy={12} r={9} fill="none" stroke={failed ? qm.error : qm.off} strokeWidth={2} />
              </Svg>
            )}
            <Typography preset="qmMeta" color={color}>{r.label}</Typography>
          </View>
        );
      })}
    </View>
  );
}

/** 30s countdown that's been started (a code was just sent) → "Resend code" link. */
export function useResendTimer(seconds = 30) {
  const [left, setLeft] = useState(seconds);
  const id = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useCallback(() => {
    if (id.current) clearInterval(id.current);
    setLeft(seconds);
    id.current = setInterval(() => setLeft(l => {
      if (l <= 1 && id.current) clearInterval(id.current);
      return Math.max(l - 1, 0);
    }), 1000);
  }, [seconds]);
  useEffect(() => { start(); return () => { if (id.current) clearInterval(id.current); }; }, [start]);
  return { left, restart: start };
}

export function QMResendRow({ left, onResend, busy, small }: { left: number; onResend: () => void; busy?: boolean; small?: boolean }) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const preset = small ? 'qmBody' : 'qmLead';
  if (left > 0) {
    return (
      <Typography preset={preset} color={qm.muted}>
        {t('resendIn')}{' '}
        <Typography preset="qmLink" color={qm.ink} style={styles.tabular}>{`0:${String(left).padStart(2, '0')}`}</Typography>
      </Typography>
    );
  }
  return (
    <Typography preset={preset} color={qm.muted}>
      {t('didntGetIt')}{' '}
      <Typography preset="qmLink" color={busy ? qm.muted : qm.link} onPress={busy ? undefined : onResend} accessibilityRole="button">
        {t('resendCode')}
      </Typography>
    </Typography>
  );
}

const styles = StyleSheet.create({
  seal: { width: SEAL, height: SEAL, borderRadius: radius.lg + 2, alignItems: 'center', justifyContent: 'center' },
  rules: { gap: spacing.s6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tabular: { fontVariant: ['tabular-nums'] },
});
