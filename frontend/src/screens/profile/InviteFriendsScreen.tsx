import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, ReduceMotion, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { QMBackButton, QMEmpty, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { AskIcon, CheckIcon, CopyIcon, GiftIcon, InfoIcon, LeafIcon, ShareUpIcon } from '../../components/icons';
import { useReferral, useRedeemReferral } from '../../hooks';
import { getErrorMessage } from '../../api';
import { shareToWhatsApp } from '../../utils';
import { qmFont, radius, spacing, useTheme } from '../../theme';

// ponytail: mirrors backend credits.service REFERRER_CAP — expose it on /credits/referral if it ever changes.
const REFERRER_CAP = 25;
const CODE_H = 58;
const BTN_H = 52;
const FIELD_H = 50;
const STEP_DOT = 26;
const WIGGLE_DEG = 3;
const WIGGLE_MS = 2500;

/** The gift sways a little, like it's waiting to be opened. */
function Gift() {
  const { qm } = useTheme();
  const r = useSharedValue(-WIGGLE_DEG);
  useEffect(() => {
    r.value = withRepeat(withSequence(
      withTiming(WIGGLE_DEG, { duration: WIGGLE_MS, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
      withTiming(-WIGGLE_DEG, { duration: WIGGLE_MS, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
    ), -1);
  }, [r]);
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <Animated.View style={sway}><GiftIcon size={54} color={qm.goldText} strokeWidth={1.4} /></Animated.View>;
}

export function InviteFriendsScreen({ navigation }: ProfileScreenProps<'InviteFriends'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: referral, isLoading, isError, refetch } = useReferral();
  const redeem = useRedeemReferral();
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const code = referral?.code ?? '';
  const reward = referral?.rewardPerReferral ?? 5;
  const newUserReward = referral?.newUserReward ?? 5;
  const joined = referral?.referredCount ?? 0;

  const shareMessage = t('profile:invite.shareMessage', {
    code,
    url: `https://getverdance.com/?ref=${code}`,
    defaultValue: 'Join me on Verdance — AI Bible-study flashcards & quizzes 📖✨ Use my code {{code}} when you sign up and we both get free credits! {{url}}',
  });

  const onCopy = () => {
    if (!code) return;
    Clipboard.setString(code);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const onRedeem = async () => {
    const value = codeInput.trim();
    if (!value) return;
    try {
      const res = await redeem.mutateAsync(value);
      Toast.show({ type: 'success', text1: t('profile:qmInvite.redeemed', { count: res.granted }) });
      setCodeInput('');
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
    }
  };

  if (isLoading || isError) {
    return (
      <View style={[styles.flex, styles.content, { backgroundColor: qm.bg, paddingTop: insets.top + spacing.sm }]}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmInvite.back')} />
        {isLoading
          ? <ActivityIndicator color={qm.violet} style={styles.loading} />
          : <QMEmpty icon={InfoIcon} title={t('profile:qmFriends.loadFailed')} action={{ label: t('profile:qmFriends.tryAgain'), onPress: () => refetch() }} />}
      </View>
    );
  }

  const steps = [t('profile:qmInvite.step1'), t('profile:qmInvite.step2'), t('profile:qmInvite.step3', { count: reward })];

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.bg }]} behavior="padding">
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmInvite.back')} />

        <Animated.View entering={qmRowEnter(0)}>
          <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hero}>
            <Gift />
            <Typography preset="qmTitle" color={qm.heroInk} style={styles.heroTitle}>{t('profile:qmInvite.heroTitle', { count: reward })}</Typography>
            <Typography preset="qmBodyMd" color={qm.heroMuted}>{t('profile:qmInvite.heroText', { mine: reward, theirs: newUserReward })}</Typography>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={qmRowEnter(1)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <Typography preset="qmFieldLabel" color={qm.muted}>{t('profile:qmInvite.yourCode')}</Typography>
          <AnimatedPressable scaleTo={0.98} onPress={onCopy} style={[styles.code, { backgroundColor: qm.lilac }]} accessibilityRole="button" accessibilityLabel={t('profile:qmInvite.copyA11y')}>
            <Typography style={[styles.codeText, { color: qm.lilacInk }]}>{code}</Typography>
            {copied ? (
              <Animated.View key="done" entering={FadeIn.duration(250)} style={styles.copy}>
                <CheckIcon size={16} color={qm.leafText} strokeWidth={2.4} />
                <Typography preset="qmLink" color={qm.leafText}>{t('profile:qmInvite.copied')}</Typography>
              </Animated.View>
            ) : (
              <View style={styles.copy}>
                <CopyIcon size={16} color={qm.lilacInk} strokeWidth={2} />
                <Typography preset="qmLink" color={qm.lilacInk}>{t('profile:qmInvite.copy')}</Typography>
              </View>
            )}
          </AnimatedPressable>
          <AnimatedPressable scaleTo={0.97} onPress={() => code && shareToWhatsApp(shareMessage, 'referral')} style={[styles.whatsapp, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
            <AskIcon size={18} color={qm.onViolet} strokeWidth={2} />
            <Typography preset="qmButtonLg" color={qm.onViolet}>{t('profile:qmInvite.whatsapp')}</Typography>
          </AnimatedPressable>
          <AnimatedPressable scaleTo={0.97} onPress={() => code && Share.share({ message: shareMessage }).catch(() => {})} style={styles.more} accessibilityRole="button">
            <ShareUpIcon size={16} color={qm.link} strokeWidth={2} />
            <Typography preset="qmSegment" color={qm.link}>{t('profile:qmInvite.more')}</Typography>
          </AnimatedPressable>
        </Animated.View>

        <Animated.View entering={qmRowEnter(2)} style={styles.steps}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.step, { backgroundColor: qm.field }]}>
              <View style={[styles.stepDot, { backgroundColor: qm.surface }]}>
                <Typography preset="qmChip" color={qm.link}>{i + 1}</Typography>
              </View>
              <Typography preset="qmMeta" color={qm.body} align="center" style={styles.stepText}>{s}</Typography>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={qmRowEnter(3)} style={[styles.joined, { backgroundColor: qm.leafBg }]}>
          <LeafIcon size={22} color={qm.leaf} filled />
          <View style={styles.flex}>
            <Typography preset="qmSegment" color={qm.leafText}>
              {joined > 0 ? t('profile:qmInvite.joined', { count: joined, credits: Math.min(joined, REFERRER_CAP) * reward }) : t('profile:qmInvite.noneJoined')}
            </Typography>
            <Typography preset="qmMeta" color={qm.leafText} style={styles.cap}>{t('profile:qmInvite.cap', { count: REFERRER_CAP })}</Typography>
          </View>
        </Animated.View>

        <View style={[styles.redeemWrap, { borderTopColor: qm.hair }]}>
          {referral && !referral.alreadyRedeemed ? (
            <>
              <Typography preset="qmBodyLg" color={qm.ink}>{t('profile:qmInvite.gotCode')}</Typography>
              <Typography preset="qmBody" color={qm.muted} style={styles.cap}>{t('profile:qmInvite.gotCodeText', { count: newUserReward })}</Typography>
              <View style={styles.redeemRow}>
                <TextInput
                  value={codeInput}
                  onChangeText={v => setCodeInput(v.toUpperCase())}
                  placeholder={t('profile:qmInvite.codePh')}
                  placeholderTextColor={qm.muted}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={16}
                  returnKeyType="done"
                  onSubmitEditing={onRedeem}
                  accessibilityLabel={t('profile:qmInvite.codeLabel')}
                  style={[styles.codeField, { backgroundColor: qm.field, color: qm.ink }]}
                />
                <AnimatedPressable
                  scaleTo={0.97}
                  onPress={onRedeem}
                  disabled={!codeInput.trim() || redeem.isPending}
                  style={[styles.apply, { backgroundColor: qm.lilac }]}
                  accessibilityRole="button"
                >
                  {redeem.isPending ? <ActivityIndicator size="small" color={qm.lilacInk} /> : <Typography preset="qmButton" color={qm.lilacInk}>{t('profile:qmInvite.apply')}</Typography>}
                </AnimatedPressable>
              </View>
            </>
          ) : (
            <View style={styles.redeemed}>
              <CheckIcon size={18} color={qm.leaf} strokeWidth={2.6} />
              <Typography preset="qmSegment" color={qm.leafText} style={styles.flex}>{t('profile:qmInvite.redeemed', { count: newUserReward })}</Typography>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  loading: { marginTop: spacing.xxxl },
  hero: { marginTop: spacing.s6, paddingVertical: spacing.s22, paddingHorizontal: spacing.xl, borderRadius: radius.lg + 2 },
  heroTitle: { marginTop: spacing.md, marginBottom: spacing.s6 },
  card: { marginTop: spacing.s14, padding: spacing.lg, borderRadius: radius.r20 + 2 },
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: CODE_H, marginTop: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  codeText: { fontFamily: qmFont.serifMedium, fontSize: 26, lineHeight: 32, letterSpacing: 5 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6 },
  whatsapp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: BTN_H, marginTop: spacing.s10, borderRadius: radius.md },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 46, marginTop: spacing.s6 },
  steps: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.s14 },
  step: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.s10, borderRadius: radius.md },
  stepDot: { width: STEP_DOT, height: STEP_DOT, borderRadius: STEP_DOT / 2, alignItems: 'center', justifyContent: 'center' },
  stepText: { marginTop: spacing.s6 },
  joined: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.s14, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r17 + 1 },
  cap: { marginTop: spacing.s2 },
  redeemWrap: { marginTop: spacing.xxl, paddingTop: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth },
  redeemRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  codeField: { flex: 1, minWidth: 0, height: FIELD_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, fontFamily: qmFont.regular, fontSize: 16, letterSpacing: 2 },
  apply: { height: FIELD_H, paddingHorizontal: spacing.s18, borderRadius: radius.r12 + 2, alignItems: 'center', justifyContent: 'center' },
  redeemed: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
});
