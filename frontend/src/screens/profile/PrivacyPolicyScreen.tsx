import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMBackButton, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { ChevronDownIcon, LeafIcon } from '../../components/icons';
import { radius, spacing, useTheme } from '../../theme';

// Bump with every change to the policy text below (and the website's privacy.html).
const LAST_UPDATED = new Date(2026, 9, 22);
const CONTACT = 'ddtechservices.work@gmail.com';
const SHORT = ['short1', 'short2', 'short3', 'short4', 'short5', 'short6'] as const;
const SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;
const ROW_H = 56;

function Chevron({ open }: { open: boolean }) {
  const { qm } = useTheme();
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: 300 }) }] }), [open]);
  return <Animated.View style={spin}><ChevronDownIcon size={18} color={qm.muted} strokeWidth={2} /></Animated.View>;
}

/** Shown from Settings / About / Plans and, signed out, from Login + Register (AuthNavigator). */
export function PrivacyPolicyScreen() {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [open, setOpen] = useState<number>(2);
  const updated = LAST_UPDATED.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxxl }]} showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmPrivacy.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmPrivacy.title')}</Typography>
        <Typography preset="qmBody" color={qm.muted}>{t('profile:qmPrivacy.updated', { date: updated })}</Typography>

        <Animated.View entering={qmRowEnter(0)}>
          <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hero}>
            <Typography preset="qmBarTitle" color={qm.heroInk}>{t('profile:qmPrivacy.shortTitle')}</Typography>
            <View style={styles.shortList}>
              {SHORT.map(k => (
                <View key={k} style={styles.shortRow}>
                  <View style={styles.leaf}><LeafIcon size={16} color={qm.leaf} filled /></View>
                  <Typography preset="qmBodyMd" color={qm.heroInk} style={styles.flex}>{t(`profile:qmPrivacy.${k}`)}</Typography>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t('profile:qmPrivacy.full')}</Typography>
        <Animated.View entering={qmRowEnter(1)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          {SECTIONS.map((k, i) => {
            const isOpen = open === i;
            return (
              <View key={k} style={i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }}>
                <AnimatedPressable
                  scaleTo={0.99}
                  onPress={() => setOpen(isOpen ? -1 : i)}
                  style={styles.secHead}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                >
                  <Typography preset="qmBodyLg" color={qm.ink} style={styles.flex}>{t(`profile:qmPrivacy.${k}Title`)}</Typography>
                  <Chevron open={isOpen} />
                </AnimatedPressable>
                {isOpen && (
                  <Animated.View entering={FadeInUp.duration(320)}>
                    <Typography preset="qmBodyMd" color={qm.body} style={styles.secBody}>{t(`profile:qmPrivacy.${k}`)}</Typography>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </Animated.View>

        <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.contact}>
          {t('profile:qmPrivacy.questions')}
          <Typography preset="qmChip" color={qm.link} onPress={() => Linking.openURL(`mailto:${CONTACT}`)} accessibilityRole="link">{CONTACT}</Typography>
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  hero: { marginTop: spacing.lg, padding: spacing.s18, borderRadius: radius.r20 + 2 },
  shortList: { gap: spacing.s10, marginTop: spacing.md },
  shortRow: { flexDirection: 'row', gap: spacing.s10 },
  leaf: { marginTop: spacing.s3 },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  card: { borderRadius: radius.r20, paddingHorizontal: spacing.lg },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, minHeight: ROW_H },
  secBody: { marginBottom: spacing.lg },
  contact: { marginTop: spacing.lg, marginHorizontal: spacing.s6 },
});
