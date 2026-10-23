import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography, VerdanceLogo } from '../ui';
import { ChevronLeftIcon, CheckIcon } from '../icons';
import { useTheme, spacing, radius } from '../../theme';

const TOUCH = 44;      // min touch target
const SOCIAL_H = 52;   // canvas social button height
const LOGO_TILE = 40;  // canvas auth logo tile
const BOX = 24;        // canvas checkbox

/** Logo tile + "Verdance" serif wordmark. */
export function QMLogoLockup() {
  const { qm } = useTheme();
  return (
    <View style={styles.lockup}>
      <View style={[styles.logoTile, { backgroundColor: qm.brand }]}>
        <VerdanceLogo size={18} color={qm.onViolet} />
      </View>
      <Typography preset="qmTitle" color={qm.ink} style={styles.wordmark}>Verdance</Typography>
    </View>
  );
}

/** Plain back arrow (no circle), 44px target, nudged to align with the page edge. */
export function QMBackButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { qm } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.back, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={label}>
      <ChevronLeftIcon size={20} color={qm.ink} />
    </Pressable>
  );
}

/** 24px rounded checkbox; `invalid` paints the border red. */
export function QMCheckbox({ value, onChange, invalid, label }: { value: boolean; onChange: (v: boolean) => void; invalid?: boolean; label: string }) {
  const { qm } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={[
        styles.box,
        value
          ? { backgroundColor: qm.violet, borderColor: qm.violet, borderRadius: radius.r6 + 1 }
          : { borderColor: invalid ? qm.error : qm.off, borderRadius: radius.r6 + 1 },
      ]}
    >
      {value && (
        <Animated.View entering={FadeIn.duration(250)}>
          <CheckIcon size={14} color={qm.onViolet} strokeWidth={3} />
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Thin rule — label — thin rule. */
export function QMDivider({ label }: { label: string }) {
  const { qm } = useTheme();
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.rule, { backgroundColor: qm.line }]} />
      <Typography preset="qmBody" color={qm.muted}>{label}</Typography>
      <View style={[styles.rule, { backgroundColor: qm.line }]} />
    </View>
  );
}

// ─── Social sign-in (Apple on iOS only; brand-mandated colours) ────────────────

function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
      <Path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.2z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

function AppleLogo({ color }: { color: string }) {
  return (
    <Svg width={18} height={20} viewBox="0 0 17 20">
      <Path fill={color} d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.4c-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-2.9-4.4zM11.5 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3-1.5z" />
    </Svg>
  );
}

export function QMSocialButtons({ onGoogle, onApple, loading }: {
  onGoogle: () => void; onApple: () => void; loading?: 'google' | 'apple' | null;
}) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  return (
    <View style={styles.socialCol}>
      {Platform.OS === 'ios' && (
        <AnimatedPressable
          scaleTo={0.97}
          onPress={onApple}
          disabled={!!loading}
          style={[styles.social, { backgroundColor: qm.appleBg }]}
          accessibilityRole="button"
          accessibilityLabel={t('social.appleContinue', 'Continue with Apple')}
        >
          {loading === 'apple' ? <ActivityIndicator size="small" color={qm.appleInk} /> : <AppleLogo color={qm.appleInk} />}
          <Typography preset="qmButtonLg" color={qm.appleInk}>{t('social.appleContinue', 'Continue with Apple')}</Typography>
        </AnimatedPressable>
      )}
      <AnimatedPressable
        scaleTo={0.97}
        onPress={onGoogle}
        disabled={!!loading}
        style={[styles.social, styles.googleBorder, { backgroundColor: qm.googleBg, borderColor: qm.googleLine }]}
        accessibilityRole="button"
        accessibilityLabel={t('social.googleContinue', 'Continue with Google')}
      >
        {loading === 'google' ? <ActivityIndicator size="small" color={qm.googleInk} /> : <GoogleG />}
        <Typography preset="qmButtonLg" color={qm.googleInk}>{t('social.googleContinue', 'Continue with Google')}</Typography>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: 0.6 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  logoTile: { width: LOGO_TILE, height: LOGO_TILE, borderRadius: radius.r12 + 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 20, lineHeight: 26 }, // ponytail: canvas 20px wordmark
  back: { width: TOUCH, height: TOUCH, marginLeft: -spacing.s10, alignItems: 'center', justifyContent: 'center' },
  box: { width: BOX, height: BOX, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rule: { flex: 1, height: StyleSheet.hairlineWidth * 2 },
  socialCol: { gap: spacing.s10 },
  social: {
    height: SOCIAL_H, borderRadius: radius.r12 + 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s10,
  },
  googleBorder: { borderWidth: 1 },
});
