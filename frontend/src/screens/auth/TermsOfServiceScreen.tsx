import React, { useState } from 'react';
import { Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../components/ui';
import { QMBackButton } from '../../components/qm';
import { ChevronDownIcon, LeafIcon } from '../../components/icons';
import { radius, spacing, useTheme } from '../../theme';

const LAST_UPDATED = 'August 2026';
const CONTACT = 'ddtechservices.work@gmail.com';
const SECTIONS = 8;
const NUM_BADGE = 28; // canvas section number tile

function Section({ n, open, onToggle }: { n: number; open: boolean; onToggle: () => void }) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const chev = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(open ? '180deg' : '0deg', { duration: 300 }) }] }));
  return (
    <View style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <Pressable onPress={onToggle} style={styles.cardHead} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <View style={[styles.num, { backgroundColor: qm.lilac }]}>
          <Typography preset="qmTag" color={qm.link} style={styles.numText}>{n}</Typography>
        </View>
        <Typography preset="qmBodyLg" color={qm.ink} style={styles.flex}>{t(`tos.sec${n}Title`)}</Typography>
        <Animated.View style={chev}><ChevronDownIcon size={18} color={qm.muted} strokeWidth={2} /></Animated.View>
      </Pressable>
      {open && (
        <Animated.View entering={FadeInUp.duration(350)}>
          <Typography preset="qmLead" color={qm.body} style={styles.cardBody}>{t(`tos.sec${n}Body`)}</Typography>
        </Animated.View>
      )}
    </View>
  );
}

export function TermsOfServiceScreen() {
  const { t } = useTranslation(['auth', 'profile']);
  const { qm } = useTheme();
  const navigation = useNavigation();
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: true });
  const [scrolled, setScrolled] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const s = e.nativeEvent.contentOffset.y > 40;
    if (s !== scrolled) setScrolled(s);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: qm.bg }]} edges={['top']}>
      {/* Compact bar: the small title + hairline fade in once the big title scrolls away. */}
      <View style={[styles.bar, { backgroundColor: qm.bg, borderBottomColor: scrolled ? qm.line : 'transparent' }]}>
        <QMBackButton onPress={() => navigation.goBack()} label={t('auth:back')} />
        {scrolled && (
          <Animated.View entering={FadeIn.duration(250)}>
            <Typography preset="qmCardTitle" color={qm.ink} style={styles.barTitle}>{t('auth:tos.title')}</Typography>
          </Animated.View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={32} showsVerticalScrollIndicator={false}>
        <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('auth:tos.title')}</Typography>
        <Typography preset="qmBody" color={qm.muted} style={styles.updated}>
          {t('profile:legal.lastUpdated', { date: LAST_UPDATED, defaultValue: `Last updated: ${LAST_UPDATED}` })}
        </Typography>

        <LinearGradient colors={qm.verse as unknown as string[]} locations={[0, 0.6, 1]} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={styles.summary}>
          <Typography preset="qmLink" color={qm.verseLabel}>{t('auth:tos.shortVersion')}</Typography>
          <View style={styles.sumList}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.sumRow}>
                <View style={styles.sumIcon}><LeafIcon size={18} color={qm.leaf} strokeWidth={2} /></View>
                <Typography preset="qmLead" color={qm.verseInk} style={[styles.flex, styles.sumText]}>{t(`auth:tos.sum${i}`)}</Typography>
              </View>
            ))}
          </View>
          <Typography preset="qmMeta" color={qm.verseLabel} style={styles.sumNote}>{t('auth:tos.sumNote')}</Typography>
        </LinearGradient>

        <View style={styles.sections}>
          {Array.from({ length: SECTIONS }, (_, i) => i + 1).map(n => (
            <Section key={n} n={n} open={!!open[n]} onToggle={() => setOpen(o => ({ ...o, [n]: !o[n] }))} />
          ))}
        </View>

        <Typography preset="qmLead" color={qm.body} style={styles.contact}>
          {t('auth:tos.questions')}{' '}
          <Typography preset="qmLink" color={qm.link} onPress={() => Linking.openURL(`mailto:${CONTACT}`).catch(() => {})}>{CONTACT}</Typography>
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, paddingHorizontal: spacing.lg + spacing.s10, paddingBottom: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  barTitle: { fontSize: 18, lineHeight: 24 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.s48 },
  title: { fontSize: 30, lineHeight: 35 }, // canvas inner-screen title 30px
  updated: { marginTop: spacing.s6 },
  summary: { marginTop: spacing.xl, borderRadius: radius.r20 + 2, padding: spacing.xl },
  sumList: { marginTop: spacing.md, gap: spacing.s10 },
  sumRow: { flexDirection: 'row', gap: spacing.s10 },
  sumIcon: { marginTop: spacing.s2 },
  sumText: { fontSize: 15, lineHeight: 22 },
  sumNote: { marginTop: spacing.md },
  sections: { marginTop: spacing.xl, gap: spacing.s10 },
  card: { borderRadius: radius.r18, overflow: 'hidden' },
  cardHead: { minHeight: 58, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  num: { width: NUM_BADGE, height: NUM_BADGE, borderRadius: radius.r6 + 3, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 13, lineHeight: 16 },
  cardBody: { paddingLeft: spacing.s48 + spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.lg, fontSize: 15, lineHeight: 24 },
  contact: { marginTop: spacing.xxl, fontSize: 15, lineHeight: 23 },
});
