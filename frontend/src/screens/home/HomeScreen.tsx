import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar, Typography, AnimatedPressable } from '../../components/ui';
import { VerseCard } from '../../components/domain';
import { QMFog } from '../../components/qm';
import {
  AskIcon,
  BellQMIcon,
  ChevronRightIcon,
  CloseIcon,
  LeafIcon,
  type IconComponent,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import { useHomeNavigation, type QuickTint } from '../../hooks/useHomeNavigation';
import { requestReviewOnce } from '../../utils/requestReview';
import {
  useSets,
  usePublicSets,
  useFriendsSets,
  useFriendsActivityFeed,
  useAutoDailyClaim,
  useStreak,
  useReferral,
  useDueSummary,
  useDueCards,
  useUnreadCount,
} from '../../hooks';
import { useTranslation } from 'react-i18next';
import { useTheme, spacing, radius, type QMColors } from '../../theme';
import { formatDate } from '../../utils/formatters';
import { shareToWhatsApp, buildReferralLink } from '../../utils';
import type { AppTabParamList } from '../../navigation/types';
import type { DueSummary, StudySet } from '../../types';
import type { Activity } from '../../types/activities.types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

const FOG_HEIGHT = 420;   // ponytail: canvas fog layer height
const MINI_CARD_W = 150;  // ponytail: canvas rail-card width
const QUICK_TILE = 52;    // ponytail: canvas quick-action tile
const HEADER_BTN = 44;    // canvas header button / avatar size
const enter = (i: number) => FadeInUp.duration(320).delay(i * 40);

function getGreeting(t: (key: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t('greeting.morning');
  if (h < 17) return t('greeting.afternoon');
  return t('greeting.evening');
}

function tintFor(qm: QMColors, tint: QuickTint): [string, string] {
  if (tint === 'leaf') return [qm.leafBg, qm.leaf];
  if (tint === 'gold') return [qm.goldBg, qm.goldText];
  return [qm.lilac, qm.link];
}

// ─── Header ────────────────────────────────────────────────────────────────────
const Header = React.memo(function Header({ dateLabel, name, avatarUri, unread, onAI, onBell, onAvatar }: {
  dateLabel: string; name: string; avatarUri?: string | null; unread: number;
  onAI: () => void; onBell: () => void; onAvatar: () => void;
}) {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  return (
    <View style={styles.header}>
      <AnimatedPressable scaleTo={0.97} onPress={onAvatar} accessibilityRole="button" accessibilityLabel={t('a11y.goToProfile')}>
        <Avatar uri={avatarUri} name={name} size="md" style={styles.headerAvatar} />
      </AnimatedPressable>
      <Typography preset="qmBody" color={qm.muted} style={styles.flex1} numberOfLines={1}>{dateLabel}</Typography>
      <AnimatedPressable scaleTo={0.97} onPress={onAI} style={[styles.headerBtn, { backgroundColor: qm.field }]} accessibilityRole="button" accessibilityLabel={t('a11y.aiChat')}>
        <AskIcon size={20} color={qm.ink} />
      </AnimatedPressable>
      <AnimatedPressable
        scaleTo={0.97}
        onPress={onBell}
        style={[styles.headerBtn, { backgroundColor: qm.field }]}
        accessibilityRole="button"
        accessibilityLabel={unread > 0 ? `${t('a11y.notifications')}, ${unread}` : t('a11y.notifications')}
      >
        <BellQMIcon size={20} color={qm.ink} />
        {unread > 0 && (
          <View style={[styles.bellBadge, { backgroundColor: qm.violet, borderColor: qm.field }]}>
            <Typography preset="qmTag" color={qm.onViolet}>{unread > 9 ? '9+' : unread}</Typography>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
});

// ─── Today card (due → continue → start) ───────────────────────────────────────
const TodayCard = React.memo(function TodayCard({ due, continueSet, streak, freezes, onReview, onContinue, onCreate }: {
  due?: DueSummary; continueSet: StudySet | null; streak: number; freezes: number;
  onReview: () => void; onContinue: (s: StudySet) => void; onCreate: () => void;
}) {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  const hasDue = !!due && due.dueCount > 0;

  let label: string, title: string, sub: string, btn: string, onPress: () => void;
  if (hasDue) {
    label = t('today.dueLabel'); title = t('today.dueTitle', { count: due!.dueCount });
    sub = t('today.dueSub', { count: due!.dueSets }); btn = t('today.dueBtn'); onPress = onReview;
  } else if (continueSet) {
    const count = continueSet._count?.cards ?? 0;
    label = t('today.continueLabel'); title = continueSet.title;
    sub = t('today.continueSub', { count }); btn = t('today.continueBtn');
    onPress = () => onContinue(continueSet);
  } else {
    label = t('today.startLabel'); title = t('today.startTitle');
    sub = t('today.startSub'); btn = t('today.startBtn'); onPress = onCreate;
  }
  const isStart = !hasDue && !continueSet;
  const streakLine = freezes > 0
    ? t('today.streakRest', { count: streak, rest: freezes })
    : t('today.streak', { count: streak });

  return (
    <AnimatedPressable scaleTo={0.97} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${btn}`}>
      <LinearGradient
        colors={qm.hero as unknown as string[]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={styles.hero}
      >
        <Typography preset="qmLabel" color={qm.heroMuted}>{label}</Typography>
        <Typography preset="qmTitle" color={qm.heroInk} numberOfLines={2} style={styles.heroTitle}>{title}</Typography>
        <Typography preset="qmBody" color={qm.heroMuted} style={styles.heroSub}>{sub}</Typography>
        {!isStart && streak > 0 && (
          <View style={styles.streakRow}>
            <LeafIcon size={14} color={qm.leaf} filled />
            <Typography preset="qmLabel" color={qm.heroInk}>{streakLine}</Typography>
          </View>
        )}
        <View style={styles.heroBtnRow}>
          <View style={[styles.heroBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}>
            <Typography preset="qmButton" color={qm.onViolet}>{btn}</Typography>
            <ChevronRightIcon size={16} color={qm.onViolet} strokeWidth={2} />
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
});

// ─── Sunday share card ─────────────────────────────────────────────────────────
const SundayCard = React.memo(function SundayCard({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const { t } = useTranslation(['home', 'common']);
  const { qm } = useTheme();
  const { data: referral } = useReferral();
  const onShare = useCallback(() => {
    const message = t('home:shareEvent.message', {
      streak,
      url: buildReferralLink(referral?.code),
      defaultValue: '🔥 {{streak}}-day streak on Verdance! Join me and grow in the Word: {{url}}',
    });
    shareToWhatsApp(message, 'streak');
  }, [t, streak, referral?.code]);

  return (
    <View style={[styles.sunday, { backgroundColor: qm.leafBg }]}>
      <Typography preset="qmBodyLg" color={qm.leafText}>{t('home:shareEvent.title')}</Typography>
      <Typography preset="qmBody" color={qm.body} style={styles.sundaySub}>{t('home:shareEvent.subtitle')}</Typography>
      <AnimatedPressable scaleTo={0.97} onPress={onShare} style={[styles.sundayBtn, { backgroundColor: qm.surface }]} accessibilityRole="button">
        <Typography preset="qmLink" color={qm.leafText}>{t('home:shareEvent.cta')}</Typography>
      </AnimatedPressable>
      <Pressable onPress={onDismiss} hitSlop={4} style={styles.sundayClose} accessibilityRole="button" accessibilityLabel={t('common:actions.close', 'Close')}>
        <CloseIcon size={14} color={qm.leafText} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
});

// ─── Quick action tile ─────────────────────────────────────────────────────────
const QuickAction = React.memo(function QuickAction({ Icon, label, tint, onPress }: {
  Icon: IconComponent; label: string; tint: QuickTint; onPress: () => void;
}) {
  const { qm } = useTheme();
  const [bg, ink] = tintFor(qm, tint);
  return (
    <AnimatedPressable scaleTo={0.97} style={styles.quickAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.quickTile, { backgroundColor: bg }]}>
        <Icon size={22} color={ink} />
      </View>
      <Typography preset="qmCaption" color={qm.ink} align="center" numberOfLines={2}>{label}</Typography>
    </AnimatedPressable>
  );
});

// ─── Section header ────────────────────────────────────────────────────────────
const SectionRow = React.memo(function SectionRow({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { qm } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Typography preset="qmSection" color={qm.ink}>{title}</Typography>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => [styles.seeAll, pressed && styles.pressedDim]} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Typography preset="qmLink" color={qm.link}>{actionLabel}</Typography>
        </Pressable>
      )}
    </View>
  );
});

// ─── Recent set card (2-col grid) ──────────────────────────────────────────────
const RecentSetCard = React.memo(function RecentSetCard({ set, color, isDue, onSelect }: {
  set: StudySet; color: string; isDue: boolean; onSelect: (s: StudySet) => void;
}) {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  const count = set._count?.cards ?? 0;
  return (
    <AnimatedPressable
      scaleTo={0.97}
      style={[styles.setCard, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
      onPress={() => onSelect(set)}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openSet', { title: set.title })}
    >
      <View style={styles.setCardTop}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        {isDue && (
          <View style={[styles.dueTag, { backgroundColor: qm.leafBg }]}>
            <Typography preset="qmTag" color={qm.leafText}>{t('today.due')}</Typography>
          </View>
        )}
      </View>
      <Typography preset="qmCardTitle" color={qm.ink} numberOfLines={2} style={styles.setCardTitle}>{set.title}</Typography>
      <Typography preset="qmMeta" color={qm.muted}>{t('today.cardCount', { count })}</Typography>
    </AnimatedPressable>
  );
});

// ─── Rail card (friends' / community sets) ─────────────────────────────────────
const RailCard = React.memo(function RailCard({ set, color, showOwner, onSelect }: {
  set: StudySet; color: string; showOwner: boolean; onSelect: (s: StudySet) => void;
}) {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  const count = set._count?.cards ?? 0;
  const owner = set.user?.name?.split(' ')[0];
  return (
    <AnimatedPressable
      scaleTo={0.97}
      style={[styles.railCard, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
      onPress={() => onSelect(set)}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openSet', { title: set.title })}
    >
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <Typography preset="qmCardTitle" color={qm.ink} numberOfLines={2} style={styles.railTitle}>{set.title}</Typography>
      <Typography preset="qmCaption" color={qm.muted} numberOfLines={1}>
        {showOwner && owner ? t('today.ownerCards', { name: owner, count }) : t('today.cardCount', { count })}
      </Typography>
    </AnimatedPressable>
  );
});

// ─── Friend activity ───────────────────────────────────────────────────────────
function activityText(a: Activity, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const name = a.user?.name ?? t('activity.unknownUser');
  switch (a.type) {
    case 'ADDED_FRIEND':  return t('activity.addedFriend', { name });
    case 'CREATED_SET':   return t('activity.createdSet', { name });
    case 'CREATED_CARD':  return t('activity.createdCard', { name });
    case 'STUDIED_CARDS': return t('activity.studiedCards', { name });
    case 'CREATED_NOTE':  return t('activity.wroteNote', { name });
    default: return t('activity.wasActive', { name });
  }
}

const ActivityRow = React.memo(function ActivityRow({ activity, first }: { activity: Activity; first: boolean }) {
  const { t } = useTranslation('home');
  const { qm } = useTheme();
  const text = activityText(activity, t);
  const name = activity.user?.name ?? '';
  // Bold the friend's name wherever the locale placed it.
  const at = name ? text.indexOf(name) : -1;
  return (
    <View style={[styles.activityRow, !first && { borderTopColor: qm.hair, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Avatar uri={activity.user?.profileImage} name={activity.user?.name} size="sm" />
      <Typography preset="qmBody" color={qm.ink} style={styles.flex1} numberOfLines={2}>
        {at < 0 ? text : (
          <>
            {text.slice(0, at)}
            <Typography preset="qmLink" color={qm.ink}>{name}</Typography>
            {text.slice(at + name.length)}
          </>
        )}
      </Typography>
      <Typography preset="qmCaption" color={qm.muted}>{formatDate(activity.createdAt)}</Typography>
    </View>
  );
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const { t, i18n } = useTranslation(['home', 'common']);
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();
  const { qm } = useTheme();

  const { data: sets } = useSets();
  const { data: publicData } = usePublicSets();
  const { data: friendsData } = useFriendsSets();
  const { data: activityData } = useFriendsActivityFeed();
  const { data: streakData } = useStreak();
  const { data: dueSummary } = useDueSummary();
  const unread = useUnreadCount();
  useAutoDailyClaim();

  const nav = useHomeNavigation(navigation);
  const dueCards = useDueCards();

  // Today card → the spaced-repetition review flow (real, tracked SM-2 session).
  const handleReviewDue = useCallback(async () => {
    const res = await dueCards.refetch();
    const cards = res.data ?? [];
    if (cards.length === 0) return;
    const setIds = [...new Set(cards.map(c => c.setId))];
    const title = t('quiz:hub.reviewDue', 'Review due cards');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Quiz is a root-stack route, outside the tab param list
    (navigation as any).navigate('Quiz', { setIds, setTitles: [title], reviewCards: cards, mode: 'mix', quizName: title });
  }, [dueCards, navigation, t]);

  const publicSets  = useMemo(() => (publicData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [publicData]);
  const friendsSets = useMemo(() => (friendsData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [friendsData]);
  const activities  = useMemo(() => (activityData?.pages.flatMap(p => p.activities) ?? []).slice(0, 5), [activityData]);
  const streak      = streakData?.streak ?? 0;
  // Ask for an app-store rating once when the user hits a streak milestone.
  useEffect(() => {
    if ([3, 7, 30, 100].includes(streak)) requestReviewOnce(`streak_${streak}`);
  }, [streak]);

  // Sunday share card — shown on Sundays until dismissed for that day.
  // Local-date key (matches getDay's locality) so dismissal doesn't slip across the UTC boundary.
  const [showShareEvent, setShowShareEvent] = useState(false);
  const todayKey = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }, []);
  useEffect(() => {
    if (new Date().getDay() !== 0) return; // Sunday only
    AsyncStorage.getItem('@bsp/share_event_dismissed').then(v => setShowShareEvent(v !== todayKey()));
  }, [todayKey]);
  const dismissShareEvent = useCallback(() => {
    setShowShareEvent(false);
    AsyncStorage.setItem('@bsp/share_event_dismissed', todayKey()).catch(() => {});
  }, [todayKey]);

  const firstName   = user?.name?.split(' ')[0] ?? 'Friend';
  const continueSet = sets?.[0] ?? null;
  const recentSets  = useMemo(
    () => [...(sets ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [sets],
  );
  const hasDue = !!dueSummary && dueSummary.dueCount > 0;
  // New user (nothing to review, no sets): just the verse, Start card + quick actions.
  const isNewUser = !hasDue && !continueSet;
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }),
    [i18n.language],
  );
  const colorAt = (i: number) => qm.setColors[i % qm.setColors.length];

  return (
    <View style={[styles.root, { backgroundColor: qm.bg }]}>
      <QMFog height={FOG_HEIGHT} />
      <SafeAreaView style={styles.flex1} edges={['top']}>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Header
            dateLabel={dateLabel}
            name={user?.name ?? firstName}
            avatarUri={user?.profileImage}
            unread={unread}
            onAI={nav.onAI}
            onBell={nav.onBell}
            onAvatar={nav.onAvatar}
          />
          <Animated.View entering={enter(0)}>
            <Typography preset="qmDisplay" color={qm.ink} style={styles.greeting}>
              {getGreeting(t)}, {firstName}
            </Typography>
          </Animated.View>

          {!hasDue && (
            <Animated.View entering={enter(1)} style={styles.gapBelow}>
              <VerseCard />
            </Animated.View>
          )}

          <Animated.View entering={enter(1)}>
            <TodayCard
              due={dueSummary}
              continueSet={continueSet}
              streak={streak}
              freezes={streakData?.freezes ?? 0}
              onReview={handleReviewDue}
              onContinue={nav.goContinue}
              onCreate={nav.goCreate}
            />
          </Animated.View>

          {/* Reviews due → the review card leads and the verse is a quiet second card. */}
          {hasDue && (
            <Animated.View entering={enter(2)} style={styles.gapSm}>
              <VerseCard />
            </Animated.View>
          )}

          {showShareEvent && !isNewUser && (
            <Animated.View entering={enter(2)} style={styles.gapSm}>
              <SundayCard streak={streak} onDismiss={dismissShareEvent} />
            </Animated.View>
          )}

          <Animated.View entering={enter(3)} style={styles.quickGrid}>
            {nav.quickActions.map(a => (
              <QuickAction key={a.label} Icon={a.Icon} label={a.label} tint={a.tint} onPress={a.onPress} />
            ))}
          </Animated.View>

          {!isNewUser && recentSets.length > 0 && (
            <>
              <SectionRow title={t('home:sections.recentSets')} actionLabel={t('home:sections.seeAll')} onAction={nav.goLibrary} />
              <View style={styles.setGrid}>
                {recentSets.map((s, i) => (
                  <Animated.View key={s.id} entering={enter(4 + i)} style={styles.setGridCell}>
                    <RecentSetCard set={s} color={colorAt(i)} isDue={dueSummary?.topSet?.id === s.id} onSelect={nav.goContinue} />
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {!isNewUser && friendsSets.length > 0 && (
            <>
              <SectionRow title={t('home:sections.friendsSets')} actionLabel={t('home:sections.seeAll')} onAction={nav.goFriendsSets} />
              <View style={styles.railWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                  {friendsSets.map((s, i) => (
                    <RailCard key={s.id} set={s} color={colorAt(i + 1)} showOwner onSelect={nav.goViewSet} />
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {!isNewUser && activities.length > 0 && (
            <>
              <SectionRow title={t('home:sections.friendActivity')} />
              <View style={[styles.activityCard, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
                {activities.map((a, i) => <ActivityRow key={a.id} activity={a} first={i === 0} />)}
              </View>
            </>
          )}

          {!isNewUser && publicSets.length > 0 && (
            <>
              <SectionRow title={t('home:sections.communitySets')} actionLabel={t('home:sections.seeAll')} onAction={nav.goPublicSets} />
              <View style={styles.railWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
                  {publicSets.map((s, i) => (
                    <RailCard key={s.id} set={s} color={colorAt(i + 3)} showOwner={false} onSelect={nav.goViewSet} />
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex1: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.huge },
  pressedDim: { opacity: 0.7 },
  gapSm: { marginTop: spacing.md },
  gapBelow: { marginBottom: spacing.md },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  headerAvatar: { width: HEADER_BTN, height: HEADER_BTN, borderRadius: HEADER_BTN / 2 },
  headerBtn: { width: HEADER_BTN, height: HEADER_BTN, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: spacing.s6, right: spacing.s6, minWidth: spacing.lg, height: spacing.lg,
    borderRadius: spacing.sm, borderWidth: 2, paddingHorizontal: spacing.s3,
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { marginTop: spacing.md, marginBottom: spacing.s18 },

  // Today card
  hero: { borderRadius: radius.lg, padding: spacing.xl },
  heroTitle: { marginTop: spacing.s6 },
  heroSub: { marginTop: spacing.s6 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, marginTop: spacing.s10 },
  heroBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.s14 },
  heroBtn: {
    height: spacing.huge + 2, paddingHorizontal: spacing.s18, borderRadius: radius.pill, // ponytail: canvas 42px button
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
  },

  // Sunday card
  sunday: { borderRadius: radius.r20, padding: spacing.lg, paddingRight: spacing.s48 },
  sundaySub: { marginTop: spacing.s3 },
  sundayBtn: { alignSelf: 'flex-start', marginTop: spacing.s10, height: spacing.huge, paddingHorizontal: spacing.s14, borderRadius: radius.r12, justifyContent: 'center' },
  sundayClose: { position: 'absolute', top: spacing.s6, right: spacing.s6, width: spacing.huge, height: spacing.huge, alignItems: 'center', justifyContent: 'center' },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.s22 },
  quickAction: { width: '25%', alignItems: 'center', gap: spacing.s6, paddingVertical: spacing.s10, paddingHorizontal: spacing.xs },
  quickTile: { width: QUICK_TILE, height: QUICK_TILE, borderRadius: radius.r18, alignItems: 'center', justifyContent: 'center' },

  // Section header
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginTop: spacing.xxl, marginBottom: spacing.s10, marginHorizontal: spacing.xs,
  },
  seeAll: { paddingVertical: spacing.s6 },

  // Recent sets grid
  setGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.s5 },
  setGridCell: { width: '50%', padding: spacing.s5 },
  setCard: { padding: spacing.s14, borderRadius: radius.r20 },
  setCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: spacing.lg + 2 },
  colorBar: { width: spacing.s28, height: spacing.s6, borderRadius: radius.r3 },
  dueTag: { borderRadius: radius.r6, paddingHorizontal: spacing.s7, paddingVertical: spacing.s2 },
  setCardTitle: { marginTop: spacing.md, marginBottom: spacing.xs, minHeight: spacing.s38 + 4 }, // ponytail: 2-line title slot

  // Rails
  railWrap: { marginHorizontal: -spacing.xl },
  railContent: { gap: spacing.s10, paddingHorizontal: spacing.xl, paddingBottom: spacing.xs },
  railCard: { width: MINI_CARD_W, padding: spacing.s14, borderRadius: radius.r18 },
  railTitle: { marginTop: spacing.s10, marginBottom: spacing.xs },

  // Activity
  activityCard: { borderRadius: radius.r20, paddingHorizontal: spacing.lg },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 58 }, // ponytail: canvas row height
});
