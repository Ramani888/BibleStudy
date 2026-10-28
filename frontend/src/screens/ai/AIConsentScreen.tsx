import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMButton, QMFog } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { BookIcon, ChevronDownIcon, ChevronUpIcon, GlobeIcon, SendIcon, type IconComponent } from '../../components/icons';
import { useTabBarSpace } from '../../hooks';
import { spacing, radius, qmFont, useTheme } from '../../theme';
import { storage } from '../../utils/storage';
import type { AIScreenProps } from '../../navigation/types';
import { SparkMark } from './components/SparkMark';

const TERMS_URL = 'https://getverdance.com/terms.html';
const PRIVACY_URL = 'https://getverdance.com/privacy.html';
const MARK_TILE = 84;
const ROW_TILE = 36;
const TOGGLE_H = 48;
const LINK_H = 48;

// Keep each link on one line.
const nbsp = (s: string) => s.replace(/ /g, ' ');
const rise = (i: number) => FadeInUp.duration(320).delay(100 + i * 60);

export function AIConsentScreen({ navigation, route }: AIScreenProps<'AIConsent'>) {
  const { t } = useTranslation(['ai', 'common', 'profile']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  // A question handed over from another screen (e.g. "Ask AI about this card").
  const autoSend = route.params?.autoSend;

  // Back to the chat already under us (Home / card hand-off), else swap this screen for it.
  const goChat = useCallback(() => {
    const params = autoSend ? { autoSend } : undefined;
    if (navigation.getState().routes.some(r => r.name === 'AIChat')) navigation.popTo('AIChat', params);
    else navigation.replace('AIChat', params);
  }, [navigation, autoSend]);

  useEffect(() => {
    storage.getAiPolicyAccepted()
      .then(accepted => {
        if (accepted) {
          goChat();
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false)); // storage read failed — show consent rather than blank screen
  }, [goChat]);

  const handleAccept = async () => {
    await storage.setAiPolicyAccepted();
    goChat();
  };

  const handleDecline = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  if (checking) return <View style={[styles.flex, { backgroundColor: qm.bg }]} />;

  const rows: { icon: IconComponent; bg: string; ink: string; title: string; text: React.ReactNode }[] = [
    { icon: SendIcon, bg: qm.lilac, ink: qm.link, title: t('ai:qm.consent.sendTitle', 'What we send'), text: t('ai:qm.consent.sendText', 'The questions you type, and any PDF or image you attach.') },
    {
      icon: GlobeIcon, bg: qm.goldBg, ink: qm.goldText, title: t('ai:qm.consent.whoTitle', 'Who reads it'),
      text: (
        <>
          {t('ai:qm.consent.whoA', 'Our AI providers, ')}
          <Typography preset="qmBody" color={qm.body} style={styles.bold}>OpenRouter</Typography>
          {t('ai:qm.consent.whoAnd', ' and ')}
          <Typography preset="qmBody" color={qm.body} style={styles.bold}>Anthropic (Claude)</Typography>
          {t('ai:qm.consent.whoB', ', use it only to write your answer. Please don’t share private personal details.')}
        </>
      ),
    },
    { icon: BookIcon, bg: qm.leafBg, ink: qm.leaf, title: t('ai:qm.consent.checkTitle', 'Check it with Scripture'), text: t('ai:qm.consent.checkText', 'AI can make mistakes. For important questions, talk with your pastor or a trusted commentary.') },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <QMFog height={440} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s30 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.markTile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <SparkMark size={38} />
        </View>
        <Animated.View entering={rise(0)}>
          <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.title} accessibilityRole="header">
            {t('ai:qm.consent.title', 'Before you ask')}
          </Typography>
          <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.lead}>
            {t('ai:qm.consent.lead', 'Ask about any passage and get answers that point you back to Scripture. Here is how your questions are handled.')}
          </Typography>
        </Animated.View>

        <Animated.View entering={rise(1)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          {rows.map((r, i) => (
            <View key={r.title} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}>
              <View style={[styles.rowTile, { backgroundColor: r.bg }]}>
                <r.icon size={18} color={r.ink} strokeWidth={2} />
              </View>
              <View style={styles.flex}>
                <Typography preset="qmSegment" color={qm.ink}>{r.title}</Typography>
                <Typography preset="qmBody" color={qm.body} style={styles.rowText}>{r.text}</Typography>
              </View>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={rise(2)}>
          <AnimatedPressable
            scaleTo={0.97}
            onPress={() => setOpen(o => !o)}
            style={[styles.toggle, { backgroundColor: qm.field }]}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
          >
            <Typography preset="qmSegment" color={qm.ink}>{t('ai:qm.consent.more', 'More about your data')}</Typography>
            {open ? <ChevronUpIcon size={18} color={qm.muted} strokeWidth={2} /> : <ChevronDownIcon size={18} color={qm.muted} strokeWidth={2} />}
          </AnimatedPressable>
          {open && (
            <Animated.View entering={FadeInUp.duration(320)} style={styles.more}>
              <Typography preset="qmBody" color={qm.body}>
                {t('ai:qm.consent.moreText', 'Your conversations are saved to your account so you can come back to them. You can delete any conversation, or all of them, from Past conversations.')}
              </Typography>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bar, { backgroundColor: qm.glass, borderTopColor: qm.hair, paddingBottom: spacing.s14 + tabSpace }]}>
        <QMButton label={t('ai:qm.consent.agree', 'I agree, let’s start')} onPress={handleAccept} />
        <AnimatedPressable scaleTo={0.97} onPress={handleDecline} style={styles.notNow} accessibilityRole="button">
          <Typography preset="qmButton" color={qm.muted}>{t('ai:qm.consent.notNow', 'Not now')}</Typography>
        </AnimatedPressable>
        <Typography preset="qmFine" color={qm.muted} align="center">
          {t('ai:qm.consent.legal', 'By continuing you agree to our ')}
          <Typography preset="qmFine" color={qm.link} style={styles.bold} onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
            {nbsp(t('auth:termsOfService', 'Terms of Service'))}
          </Typography>
          {t('ai:qm.consent.legalAnd', ' and ')}
          <Typography preset="qmFine" color={qm.link} style={styles.bold} onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
            {nbsp(t('profile:legal.privacy', 'Privacy Policy'))}
          </Typography>
          .
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.s22, paddingBottom: spacing.xxl },
  markTile: {
    width: MARK_TILE, height: MARK_TILE, borderRadius: radius.r28, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  lead: { alignSelf: 'center', maxWidth: 310 },
  bold: { fontFamily: qmFont.semibold },
  card: { marginTop: spacing.xxl, borderRadius: radius.r20 + 2, paddingVertical: spacing.s6, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.s14, paddingVertical: spacing.s14 },
  rowTile: { width: ROW_TILE, height: ROW_TILE, borderRadius: radius.r12, alignItems: 'center', justifyContent: 'center' },
  rowText: { marginTop: spacing.s3 },
  toggle: {
    marginTop: spacing.s10, minHeight: TOGGLE_H, paddingHorizontal: spacing.lg, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  more: { paddingTop: spacing.md, paddingHorizontal: spacing.lg },
  bar: { paddingHorizontal: spacing.s22, paddingTop: spacing.md, paddingBottom: spacing.s14, borderTopWidth: StyleSheet.hairlineWidth },
  notNow: { height: LINK_H, marginTop: spacing.xs, alignItems: 'center', justifyContent: 'center' },
});
