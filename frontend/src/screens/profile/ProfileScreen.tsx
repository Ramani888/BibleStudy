import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMMenuGroup, QMMenuRow, QMScoreRing, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  BagIcon, BellQMIcon, CreditIcon, DocIcon, FriendsIcon, GiftIcon, ImageIcon, LeaderboardIcon, LeafIcon, LockIcon, SettingsIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import {
  useAchievements, useCreditBalance, useNoteStats, useQuizCount, useReferral, useSetStats, useStorageUsage, useStreak, useUnreadCount,
} from '../../hooks';
import { qmFont, radius, spacing, useTheme } from '../../theme';
import { TIERS } from '../../types/subscription.types';
import type { ProfileScreenProps } from '../../navigation/types';

const RING = 96;
const RING_STROKE = 4;
const PHOTO = 78;
const BELL = 44;
const DOT = 9;
const BAR_H = 8;
const MB = 1048576;
const GB = MB * 1024;

/** Canvas sizes: whole MB below a gigabyte, one decimal above ("120 MB", "2 GB"). */
function fmtSize(bytes: number): string {
  return bytes >= GB ? `${+(bytes / GB).toFixed(1)} GB` : `${Math.round(bytes / MB)} MB`;
}

function initials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Storage bar fills in once (canvas 1s, .3s delay). */
function StorageBar({ pct, color, track }: { pct: number; color: string; track: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(300, withTiming(pct, { duration: 1000, easing: Easing.bezier(0.3, 0.9, 0.3, 1), reduceMotion: ReduceMotion.System }));
  }, [w, pct]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={[styles.bar, { backgroundColor: track }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, fill]} />
    </View>
  );
}

export function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();

  const user = useAuthStore(s => s.user);
  const unread = useUnreadCount();
  const { data: stats } = useSetStats();
  const { data: quizCount } = useQuizCount();
  const { totalNotes } = useNoteStats();
  const { data: creditData } = useCreditBalance();
  const { data: streakData } = useStreak();
  const { data: storage } = useStorageUsage();
  const { data: achievements } = useAchievements();
  const { data: referral } = useReferral();

  const plan = user?.plan ?? 'FREE';
  const isFree = plan === 'FREE';
  const [starter, pro] = TIERS;
  const streak = streakData?.streak ?? 0;

  // Ring = progress to the next streak milestone (the streak achievements' thresholds).
  const ring = useMemo(() => {
    const goals = (achievements ?? []).filter(a => a.category === 'streak').map(a => a.threshold).sort((a, b) => a - b);
    const goal = goals.find(g => g > streak) ?? goals[goals.length - 1];
    return goal ? { goal, pct: Math.min(100, (streak / goal) * 100) } : null;
  }, [achievements, streak]);
  const unlocked = achievements?.filter(a => a.unlocked).length ?? 0;

  const over = !!storage && storage.used > storage.limit;
  const limitLabel = fmtSize(storage?.limit ?? 250 * MB);

  const stat = [
    { n: quizCount, label: t('profile:qm.statQuizzes'), go: () => navigation.navigate('QuizTab', { screen: 'QuizHub' }) },
    { n: stats?.totalSets, label: t('profile:qm.statSets'), go: () => navigation.navigate('LibraryTab', { screen: 'Library' }) },
    { n: stats?.totalCards, label: t('profile:qm.statCards'), go: () => navigation.navigate('LibraryTab', { screen: 'Library' }) },
    { n: totalNotes, label: t('profile:qm.statNotes'), go: () => navigation.navigate('Notes') },
  ];

  const leaf: [string, string] = [qm.leafBg, qm.leaf];
  const gold: [string, string] = [qm.goldBg, qm.goldText];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Typography preset="qmDisplay" color={qm.ink}>{t('profile:title')}</Typography>
          <AnimatedPressable
            scaleTo={0.97}
            onPress={() => navigation.navigate('Notifications')}
            style={[styles.bell, { backgroundColor: qm.field }]}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? t('profile:qm.notificationsUnreadA11y', { count: unread }) : t('profile:qm.notificationsA11y')}
          >
            <BellQMIcon size={20} color={qm.ink} />
            {unread > 0 && <View style={[styles.dot, { backgroundColor: qm.violet, borderColor: qm.field }]} />}
          </AnimatedPressable>
        </View>

        {/* ── Who you are ── */}
        <Animated.View entering={qmRowEnter(0)} style={styles.me}>
          <QMScoreRing
            pct={ring ? ring.pct : 0}
            size={RING}
            stroke={RING_STROKE}
            a11yLabel={ring ? t('profile:qm.ringA11y', { streak, goal: ring.goal }) : undefined}
          >
            {user?.profileImage
              ? <Image source={{ uri: user.profileImage }} style={[styles.photo, { backgroundColor: qm.field }]} />
              : (
                <View style={[styles.photo, styles.initialsWrap, { backgroundColor: qm.lilac }]}>
                  <Typography style={[styles.initials, { color: qm.lilacInk }]}>{initials(user?.name)}</Typography>
                </View>
              )}
          </QMScoreRing>
          <View style={styles.flex}>
            <Typography preset="qmTitle" color={qm.ink} numberOfLines={2}>{user?.name}</Typography>
            {streak > 0 && (
              <View style={[styles.chip, { backgroundColor: qm.leafBg }]}>
                <LeafIcon size={13} color={qm.leafText} filled />
                <Typography preset="qmChip" color={qm.leafText}>{t('profile:qm.streak', { count: streak })}</Typography>
              </View>
            )}
            <AnimatedPressable scaleTo={0.97} onPress={() => navigation.navigate('EditProfile')} hitSlop={10} style={styles.editLink} accessibilityRole="button">
              <Typography preset="qmLink" color={qm.link}>{t('profile:qm.editProfile')}</Typography>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {/* ── Numbers ── */}
        <Animated.View entering={qmRowEnter(1)} style={styles.stats}>
          {stat.map(s => (
            <AnimatedPressable
              key={s.label}
              scaleTo={0.97}
              onPress={s.go}
              style={[styles.statTile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
              accessibilityRole="button"
              accessibilityLabel={`${s.n ?? 0} ${s.label}`}
            >
              <Typography style={[styles.statNum, { color: qm.ink }]}>{s.n ?? '–'}</Typography>
              <Typography preset="qmMeta" color={qm.muted} numberOfLines={1}>{s.label}</Typography>
            </AnimatedPressable>
          ))}
        </Animated.View>

        {/* ── Plans card (free only) ── */}
        {isFree && (
          <Animated.View entering={qmRowEnter(2)}>
            <AnimatedPressable scaleTo={0.97} onPress={() => navigation.navigate('Paywall')} style={styles.upsellWrap} accessibilityRole="button">
              <LinearGradient
                colors={qm.hero as unknown as string[]}
                locations={[0, 0.55, 1]}
                start={{ x: 0.18, y: 0 }}
                end={{ x: 0.82, y: 1 }}
                style={styles.upsell}
              >
                <View style={styles.flex}>
                  <Typography preset="qmRowTitle" color={qm.heroInk}>
                    {t('profile:qm.upsellTitle', { starter: starter.name, pro: pro.name })}
                  </Typography>
                  <Typography preset="qmBody" color={qm.heroMuted} style={styles.upsellText}>{t('profile:qm.upsellText')}</Typography>
                </View>
                <View style={[styles.upsellBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}>
                  <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qm.seePlans')}</Typography>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* ── Storage ── */}
        <Animated.View entering={qmRowEnter(3)}>
          <AnimatedPressable
            scaleTo={0.98}
            onPress={() => navigation.navigate(over ? 'Paywall' : 'Media')}
            style={[styles.storage, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
            accessibilityRole="button"
            accessibilityLabel={over ? t('profile:qm.storageOverA11y', { limit: limitLabel }) : t('profile:qm.storageA11y')}
          >
            <View style={styles.storageHead}>
              <Typography preset="qmBodyLg" color={qm.ink}>{t('profile:qm.storage')}</Typography>
              {over
                ? <Typography preset="qmBodyLg" color={qm.warm}>{t('profile:qm.storageOver', { limit: limitLabel })}</Typography>
                : <Typography preset="qmBodyMd" color={qm.muted}>{t('profile:qm.storageUsage', { used: fmtSize(storage?.used ?? 0), limit: limitLabel })}</Typography>}
            </View>
            <StorageBar
              pct={over ? 100 : Math.min(storage?.percent ?? 0, 100)}
              color={over ? qm.warm : qm.violet}
              track={over ? qm.errorBg : qm.lilac}
            />
            {over && (
              <Typography preset="qmMeta" color={qm.muted} style={styles.overHint}>
                {t('profile:qm.storageOverHint', { starter: starter.name, starterSize: starter.storage, pro: pro.name, proSize: pro.storage })}
              </Typography>
            )}
          </AnimatedPressable>
        </Animated.View>

        <QMMenuGroup label={t('profile:qm.sectionStudy')} index={4}>
          <QMMenuRow first icon={LeafIcon} tint={leaf} label={t('profile:qm.achievements')}
            value={achievements ? t('profile:qm.achievementsValue', { done: unlocked, total: achievements.length }) : undefined}
            onPress={() => navigation.navigate('Achievements')} />
          <QMMenuRow icon={DocIcon} tint={gold} label={t('profile:qm.myNotes')} onPress={() => navigation.navigate('Notes')} />
          <QMMenuRow icon={ImageIcon} tint={gold} label={t('profile:qm.myMedia')} onPress={() => navigation.navigate('Media')} />
        </QMMenuGroup>

        <QMMenuGroup label={t('profile:qm.sectionFriends')} index={5}>
          <QMMenuRow first icon={FriendsIcon} label={t('profile:qm.friends')} onPress={() => navigation.navigate('Friends')} />
          <QMMenuRow icon={GiftIcon} label={t('profile:qm.inviteFriends')}
            value={referral ? t('profile:qm.inviteValue', { give: referral.newUserReward, get: referral.rewardPerReferral }) : undefined}
            onPress={() => navigation.navigate('InviteFriends')} />
          <QMMenuRow icon={LeaderboardIcon} label={t('profile:qm.leaderboard')} onPress={() => navigation.navigate('Leaderboard')} />
        </QMMenuGroup>

        <QMMenuGroup label={t('profile:qm.sectionAccount')} index={6}>
          <QMMenuRow first icon={CreditIcon} label={t('profile:qm.myCredits')}
            value={creditData ? String(creditData.balance) : undefined}
            onPress={() => navigation.navigate('Credits')} />
          <QMMenuRow icon={BagIcon} label={isFree ? t('profile:qm.upgrade') : t('profile:qm.managePlan')}
            value={isFree ? t('profile:qm.planFree') : TIERS.find(x => x.plan === plan)?.name}
            onPress={() => navigation.navigate('Paywall')} />
          <QMMenuRow icon={LockIcon} label={t('profile:qm.changePassword')} onPress={() => navigation.navigate('ChangePassword')} />
          <QMMenuRow icon={SettingsIcon} label={t('profile:qm.settings')} onPress={() => navigation.navigate('Settings')} />
        </QMMenuGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: BELL, height: BELL, borderRadius: BELL / 2, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: spacing.s10, right: spacing.s10, width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2 },
  me: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2 },
  initialsWrap: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: qmFont.serifMedium, fontSize: 28, lineHeight: 34 },
  chip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.s5,
    marginTop: spacing.sm, paddingVertical: spacing.s5, paddingHorizontal: spacing.s10, borderRadius: radius.pill,
  },
  editLink: { alignSelf: 'flex-start', marginTop: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.s18 },
  statTile: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xs, borderRadius: radius.r17 + 1 },
  statNum: { fontFamily: qmFont.serifMedium, fontSize: 21, lineHeight: 26 },
  upsellWrap: { marginTop: spacing.s14 },
  upsell: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s14,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.s18, borderRadius: radius.r20 + 2,
  },
  upsellText: { marginTop: spacing.s3 },
  upsellBtn: { height: spacing.s38, paddingHorizontal: spacing.s14, borderRadius: radius.pill, justifyContent: 'center' },
  storage: { marginTop: spacing.md, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r17 + 1 },
  storageHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s10 },
  bar: { height: BAR_H, borderRadius: BAR_H / 2, marginTop: spacing.s10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: BAR_H / 2 },
  overHint: { marginTop: spacing.sm },
});
