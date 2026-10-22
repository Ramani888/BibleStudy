import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { Achievement, AchievementCategory } from '../../types';
import { useAchievements } from '../../hooks';
import { QMBackButton, QMEmpty, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { InfoIcon, LockIcon } from '../../components/icons';
import { ACHIEVEMENT_ICON, AchievementUnlockModal } from '../../components/feedback/AchievementUnlockModal';
import { qmFont, radius, spacing, useTheme } from '../../theme';

const TILE = 48;
const LOCK = 20;
const HERO_BAR = 8;
const ROW_BAR = 6;

// Canvas groups: streak, study, quiz, then Ask + friends together.
const GROUPS: { label: string; cats: AchievementCategory[] }[] = [
  { label: 'qmAch.catStreak', cats: ['streak'] },
  { label: 'qmAch.catStudy', cats: ['study'] },
  { label: 'qmAch.catQuiz', cats: ['quiz'] },
  { label: 'qmAch.catAskFriends', cats: ['ai', 'social'] },
];

/** A progress bar that fills once on mount. */
function Fill({ pct, color, track, height }: { pct: number; color: string; track: string; height: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(300, withTiming(pct, { duration: 1000, easing: Easing.bezier(0.3, 0.9, 0.3, 1), reduceMotion: ReduceMotion.System }));
  }, [w, pct]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <Animated.View style={[styles.fillBar, { borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

export function AchievementsScreen({ navigation }: ProfileScreenProps<'Achievements'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: achievements = [], isLoading, isError, refetch } = useAchievements();
  const [celebrate, setCelebrate] = useState<Achievement | null>(null);

  const done = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  // "Next up" = the unfinished one you're furthest along.
  const next = useMemo(() => achievements
    .filter(a => !a.unlocked)
    .sort((a, b) => b.progress / b.threshold - a.progress / a.threshold || a.threshold - b.threshold)[0], [achievements]);

  const groups = useMemo(() => {
    // Status rank: reached → in progress → locked, then smallest goal first.
    const rank = (a: Achievement) => (a.unlocked ? 0 : a.progress > 0 ? 1 : 2);
    return GROUPS.map(g => ({
      label: g.label,
      items: achievements.filter(a => g.cats.includes(a.category)).sort((a, b) => rank(a) - rank(b) || a.threshold - b.threshold),
    })).filter(g => g.items.length > 0);
  }, [achievements]);

  let row = 0;
  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmAch.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmAch.title')}</Typography>

        {isLoading ? (
          <ActivityIndicator color={qm.violet} style={styles.loading} />
        ) : isError ? (
          <QMEmpty icon={InfoIcon} title={t('profile:qmAch.loadFailed')} action={{ label: t('profile:qmAch.tryAgain'), onPress: () => refetch() }} />
        ) : (
          <>
            <Animated.View entering={qmRowEnter(0)}>
              <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hero}>
                <View style={styles.heroCount}>
                  <Typography style={[styles.heroNum, { color: qm.heroInk }]}>{done}</Typography>
                  <Typography preset="qmBodyLg" color={qm.heroMuted}>{t('profile:qmAch.reached', { total })}</Typography>
                </View>
                <Fill pct={total ? (done / total) * 100 : 0} color={qm.leaf} track={qm.ghost} height={HERO_BAR} />
                <Typography preset="qmBody" color={qm.heroMuted} style={styles.heroNote}>
                  {t('profile:qmAch.eachAdds', { reward: achievements[0]?.reward ?? 5 })}{' '}
                  {next ? t('profile:qmAch.nextUp', { title: next.title }) : t('profile:qmAch.allDone')}
                </Typography>
              </LinearGradient>
            </Animated.View>

            {groups.map(g => (
              <View key={g.label}>
                <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t(`profile:${g.label}`)}</Typography>
                <View style={styles.list}>
                  {g.items.map(a => {
                    const inProgress = !a.unlocked && a.progress > 0;
                    const locked = !a.unlocked && !inProgress;
                    const Icon = ACHIEVEMENT_ICON[a.category];
                    const [tileBg, tileInk] = a.unlocked ? [qm.leafBg, qm.leaf] : inProgress ? [qm.goldBg, qm.goldText] : [qm.field, qm.off];
                    const a11y = a.unlocked
                      ? t('profile:qmAch.a11yReached', { title: a.title })
                      : inProgress ? t('profile:qmAch.a11yProgress', { title: a.title, progress: a.progress, threshold: a.threshold })
                        : t('profile:qmAch.a11yLocked', { title: a.title });
                    return (
                      <Animated.View key={a.key} entering={qmRowEnter(++row)}>
                        <AnimatedPressable
                          scaleTo={0.97}
                          disabled={!a.unlocked}
                          onPress={() => setCelebrate(a)}
                          style={[styles.row, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
                          accessibilityRole={a.unlocked ? 'button' : 'text'}
                          accessibilityLabel={a11y}
                        >
                          <View style={[styles.tile, { backgroundColor: tileBg }]}>
                            <Icon size={24} color={tileInk} />
                            {locked && (
                              <View style={[styles.lock, { backgroundColor: qm.surface, borderColor: qm.hair }]}>
                                <LockIcon size={11} color={qm.off} strokeWidth={2.6} />
                              </View>
                            )}
                          </View>
                          <View style={styles.flex}>
                            <Typography preset="qmBodyLg" color={locked ? qm.muted : qm.ink}>{a.title}</Typography>
                            <Typography preset="qmMeta" color={qm.muted} style={styles.desc}>{a.description}</Typography>
                            {!a.unlocked && a.threshold > 1 && (
                              <View style={styles.progRow}>
                                <View style={styles.flex}>
                                  <Fill pct={Math.min(a.progress / a.threshold, 1) * 100} color={qm.gold} track={qm.lilac} height={ROW_BAR} />
                                </View>
                                <Typography preset="qmChip" color={qm.goldText}>
                                  {t('profile:qmAch.progress', { progress: a.progress, threshold: a.threshold })}
                                </Typography>
                              </View>
                            )}
                          </View>
                          {a.unlocked && a.reward > 0 && (
                            <View style={[styles.chip, { backgroundColor: qm.leafBg }]}>
                              <Typography preset="qmChip" color={qm.leafText}>{t('profile:qmAch.creditsChip', { count: a.reward })}</Typography>
                            </View>
                          )}
                        </AnimatedPressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <AchievementUnlockModal achievement={celebrate} onDismiss={() => setCelebrate(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.s14 },
  loading: { marginTop: spacing.xxxl },
  hero: { borderRadius: radius.r20 + 2, paddingVertical: spacing.s18, paddingHorizontal: spacing.xl },
  heroCount: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.md },
  heroNum: { fontFamily: qmFont.serifDisplay, fontSize: 38, lineHeight: 44 },
  heroNote: { marginTop: spacing.s10 },
  track: { overflow: 'hidden' },
  fillBar: { height: '100%' },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  list: { gap: spacing.s10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r20 },
  tile: { width: TILE, height: TILE, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  lock: {
    position: 'absolute', right: -spacing.xs, bottom: -spacing.xs, width: LOCK, height: LOCK, borderRadius: LOCK / 2,
    borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center',
  },
  desc: { marginTop: spacing.s2 },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  chip: { borderRadius: radius.pill, paddingVertical: spacing.s5, paddingHorizontal: spacing.s10 },
});
