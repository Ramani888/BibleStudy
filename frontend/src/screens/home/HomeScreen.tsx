import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { Avatar, Spacer, Typography, AnimatedPressable } from '../../components/ui';
import {
  FlameIcon,
  BellIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  SparklesIcon,
  SearchIcon,
  LibraryIcon,
  type IconComponent,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import { useHomeNavigation } from '../../hooks/useHomeNavigation';
import {
  useSets,
  usePublicSets,
  useFriendsSets,
  useFriendsActivityFeed,
  useFriends,
  useFolders,
  useNotes,
  useCreditBalance,
  useAutoDailyClaim,
  useStreak,
  useDueSummary,
  useNotifications,
  useNotificationPrefs,
  TYPE_TO_PREF,
} from '../../hooks';
import { useTheme, spacing, layout, radius, CARD_FILL_LIGHT } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { AppTabParamList } from '../../navigation/types';
import type { DueSummary, StudySet } from '../../types';
import type { Activity } from '../../types/activities.types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

const plural = (n: number) => (n === 1 ? '' : 's');

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Sticky Header ─────────────────────────────────────────────────────────────
const StickyHeader = React.memo(function StickyHeader({ greeting, name, avatarUri, unread, onAI, onBell, onAvatar }: {
  greeting: string; name: string; avatarUri?: string | null; unread: number;
  onAI: () => void; onBell: () => void; onAvatar: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable style={({ pressed }) => [styles.headerLeft, pressed && styles.headerLeftPressed]} onPress={onAvatar} accessibilityRole="button" accessibilityLabel="Go to profile">
        <Avatar uri={avatarUri} name={name} size="sm" />
        <View style={styles.greetingCol}>
          <Typography preset="caption" color={colors.textSecondary}>{greeting},</Typography>
          <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{name}</Typography>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable onPress={onAI} hitSlop={8} style={({ pressed }) => [styles.headerIconBtn, { backgroundColor: colors.surfaceMuted }, pressed && styles.headerIconPressed]} accessibilityRole="button" accessibilityLabel="AI Chat">
          <SparklesIcon size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={onBell} hitSlop={8} style={({ pressed }) => [styles.headerIconBtn, { backgroundColor: colors.surfaceMuted }, pressed && styles.headerIconPressed]} accessibilityRole="button" accessibilityLabel="Notifications">
          <BellIcon size={20} color={colors.textPrimary} />
          {unread > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: colors.alert }]}>
              <Typography preset="caption" color={colors.textOnAccent}>{unread > 9 ? '9+' : unread}</Typography>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
});

// ─── Featured card ─────────────────────────────────────────────────────────────
const FeaturedCard = React.memo(function FeaturedCard({ due, continueSet, streak, onReview, onContinue, onCreate }: {
  due?: DueSummary; continueSet: StudySet | null; streak: number;
  onReview: (setId: string, title: string) => void; onContinue: (s: StudySet) => void; onCreate: () => void;
}) {
  const { colors } = useTheme();
  const hasDue = !!due && due.dueCount > 0 && !!due.topSet;
  const weekProgress = Math.min(streak, 7) / 7;

  let badge: string, title: string, subtitle: string, onPress: () => void;
  if (hasDue) {
    badge = 'DUE'; title = due!.topSet!.title;
    subtitle = `${due!.dueCount} card${plural(due!.dueCount)} to review`;
    onPress = () => onReview(due!.topSet!.id, due!.topSet!.title);
  } else if (continueSet) {
    badge = 'CONTINUE'; title = continueSet.title;
    subtitle = `${continueSet._count?.cards ?? 0} card${plural(continueSet._count?.cards ?? 0)}`;
    onPress = () => onContinue(continueSet);
  } else {
    badge = 'START'; title = 'Create your first study set'; subtitle = 'Begin your journey'; onPress = onCreate;
  }

  return (
    <AnimatedPressable style={[styles.featured, { backgroundColor: colors.accent }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.featuredTop}>
        <View style={[styles.badge, { backgroundColor: colors.textOnAccent }]}>
          <Typography preset="caption" color={colors.accent}>{badge}</Typography>
        </View>
        <ArrowRightIcon size={18} color={colors.textOnAccent} />
      </View>
      <Typography preset="h4" color={colors.textOnAccent} numberOfLines={1} style={styles.featuredTitle}>{title}</Typography>
      <Typography preset="bodySm" color={colors.textOnPrimaryMuted}>{subtitle}</Typography>
      <View style={[styles.progressTrack, { backgroundColor: colors.overlayLight }]}>
        <View style={[styles.progressFill, { width: `${Math.round(weekProgress * 100)}%`, backgroundColor: colors.textOnAccent }]} />
      </View>
      <View style={styles.featuredFooter}>
        <FlameIcon size={14} color={colors.warning} />
        <Typography preset="caption" color={colors.textOnPrimaryMuted}>{streak} day streak · weekly goal {Math.min(streak, 7)}/7</Typography>
      </View>
    </AnimatedPressable>
  );
});

// ─── Circular quick action ─────────────────────────────────────────────────────
const QuickAction = React.memo(function QuickAction({ Icon, label, onPress }: { Icon: IconComponent; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable style={styles.quickAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.quickCircle, { borderColor: colors.border }]}>
        <Icon size={22} color={colors.textPrimary} />
      </View>
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </AnimatedPressable>
  );
});

// ─── Recent set row ────────────────────────────────────────────────────────────
const SetRow = React.memo(function SetRow({ set, due, onSelect }: { set: StudySet; due: boolean; onSelect: (s: StudySet) => void }) {
  const { colors, name: themeName } = useTheme();
  const isDark = themeName === 'dark';
  const count = set._count?.cards ?? 0;
  const handlePress = useCallback(() => onSelect(set), [onSelect, set]);
  return (
    <AnimatedPressable
      style={[
        styles.setRow,
        { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, shadowColor: colors.textPrimary },
        !isDark && styles.cardShadow,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${set.title}`}
    >
      <View style={[styles.setIcon, { borderColor: colors.border }]}>
        <LibraryIcon size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.flex1}>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{set.title}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>{count} card{plural(count)}</Typography>
      </View>
      {due ? (
        <View style={[styles.dueBadge, { backgroundColor: colors.successSoft }]}>
          <Typography preset="caption" color={colors.success}>DUE</Typography>
        </View>
      ) : (
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      )}
    </AnimatedPressable>
  );
});

// ─── Mini set card (horizontal rails) ─────────────────────────────────────────
const SetMiniCard = React.memo(function SetMiniCard({ set, Icon, onSelect }: { set: StudySet; Icon: IconComponent; onSelect: (s: StudySet) => void }) {
  const { colors, name: themeName } = useTheme();
  const isDark = themeName === 'dark';
  const count = set._count?.cards ?? 0;
  const handlePress = useCallback(() => onSelect(set), [onSelect, set]);
  return (
    <AnimatedPressable
      style={[
        styles.miniCard,
        { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border, shadowColor: colors.textPrimary },
        !isDark && styles.cardShadow,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${set.title}`}
    >
      <View style={[styles.miniIcon, { borderColor: colors.border }]}>
        <Icon size={18} color={colors.textPrimary} />
      </View>
      <Typography preset="label" color={colors.textPrimary} numberOfLines={2} style={styles.miniTitle}>{set.title}</Typography>
      <Typography preset="caption" color={colors.textSecondary}>{count} card{plural(count)}</Typography>
    </AnimatedPressable>
  );
});

// ─── Activity feed item ────────────────────────────────────────────────────────
function activityText(a: Activity): string {
  const name = a.user?.name ?? 'Someone';
  switch (a.type) {
    case 'ADDED_FRIEND':  return `${name} added a new friend`;
    case 'CREATED_SET':   return `${name} created a new set`;
    case 'CREATED_CARD':  return `${name} created a new card`;
    case 'STUDIED_CARDS': return `${name} studied some cards`;
    case 'CREATED_NOTE':  return `${name} wrote a note`;
    default: return `${name} was active`;
  }
}

const ActivityItem = React.memo(function ActivityItem({ activity }: { activity: Activity }) {
  const { colors } = useTheme();
  return (
    <View style={styles.activityItem}>
      <Avatar uri={activity.user?.profileImage} name={activity.user?.name} size="sm" />
      <View style={styles.flex1}>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{activityText(activity)}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>{formatDate(activity.createdAt)}</Typography>
      </View>
    </View>
  );
});

// ─── Summary stats ─────────────────────────────────────────────────────────────
const SummaryCard = React.memo(function SummaryCard({ stats }: { stats: Array<{ value: number; label: string }> }) {
  const { colors, name: themeName } = useTheme();
  const isDark = themeName === 'dark';
  return (
    <View style={styles.summaryCard}>
      {stats.map(s => (
        <View
          key={s.label}
          style={[
            styles.summaryStat,
            { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, shadowColor: colors.textPrimary },
            !isDark && styles.cardShadow,
          ]}
        >
          <Typography preset="h4" color={colors.textPrimary}>{s.value}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>{s.label}</Typography>
        </View>
      ))}
    </View>
  );
});

const SectionRow = React.memo(function SectionRow({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Typography preset="h4" color={colors.textPrimary}>{title}</Typography>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} style={({ pressed }) => [styles.rowCenter, pressed && styles.seeAllPressed]} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Typography preset="label" color={colors.accent}>{actionLabel}</Typography>
          <ChevronRightIcon size={16} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();
  const { colors } = useTheme();

  const { data: sets } = useSets();
  const { data: publicData } = usePublicSets();
  const { data: friendsData } = useFriendsSets();
  const { data: activityData } = useFriendsActivityFeed();
  const { data: friends } = useFriends();
  const { data: folders } = useFolders();
  const { data: notes } = useNotes();
  const { data: creditData } = useCreditBalance();
  const { data: streakData } = useStreak();
  const { data: dueSummary } = useDueSummary();
  const { data: notifData } = useNotifications(1);
  const notifPrefs = useNotificationPrefs();
  useAutoDailyClaim();

  const nav = useHomeNavigation(navigation);

  const publicSets  = useMemo(() => (publicData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [publicData]);
  const friendsSets = useMemo(() => (friendsData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [friendsData]);
  const activities  = useMemo(() => (activityData?.pages.flatMap(p => p.activities) ?? []).slice(0, 5), [activityData]);
  const streak      = streakData?.streak ?? 0;
  const firstName   = user?.name?.split(' ')[0] ?? 'Friend';
  const continueSet = sets?.[0] ?? null;
  const cardTotal   = useMemo(() => (sets ?? []).reduce((sum, x) => sum + (x._count?.cards ?? 0), 0), [sets]);
  const recentSets  = useMemo(
    () => [...(sets ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [sets],
  );

  const summaryStats = useMemo(() => [
    { value: friends?.length ?? 0,     label: 'Friends' },
    { value: folders?.length ?? 0,     label: 'Folders' },
    { value: sets?.length ?? 0,        label: 'Sets' },
    { value: cardTotal,                 label: 'Cards' },
    { value: creditData?.balance ?? 0, label: 'Credits' },
    { value: notes?.length ?? 0,       label: 'Notes' },
  ], [friends, folders, sets, cardTotal, creditData, notes]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StickyHeader
        greeting={getGreeting()}
        name={firstName}
        avatarUri={user?.profileImage}
        unread={
          (notifData?.notifications ?? []).filter(n => {
            if (n.read) return false;
            const prefKey = TYPE_TO_PREF[n.type];
            return prefKey ? notifPrefs[prefKey] !== false : true;
          }).length
        }
        onAI={nav.onAI}
        onBell={nav.onBell}
        onAvatar={nav.onAvatar}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <FeaturedCard
          due={dueSummary}
          continueSet={continueSet}
          streak={streak}
          onReview={nav.goReview}
          onContinue={nav.goContinue}
          onCreate={nav.goCreate}
        />

        {/* Quick actions */}
        <Spacer size={spacing.xxl} />
        <View style={styles.quickGrid}>
          {nav.quickActions.map(a => (
            <QuickAction key={a.label} Icon={a.Icon} label={a.label} onPress={a.onPress} />
          ))}
        </View>

        {/* My sets */}
        {recentSets.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="My Sets" actionLabel="See all" onAction={nav.goLibrary} />
            <Spacer size={spacing.md} />
            <View style={styles.setsList}>
              {recentSets.map(s => (
                <SetRow key={s.id} set={s} due={dueSummary?.topSet?.id === s.id} onSelect={nav.goContinue} />
              ))}
            </View>
          </>
        )}

        {/* Summary stats */}
        <Spacer size={spacing.xxl} />
        <SummaryCard stats={summaryStats} />

        {/* From your friends */}
        {friendsSets.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="From your friends" actionLabel="See all" onAction={nav.goFriendsSets} />
            <Spacer size={spacing.md} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {friendsSets.map(s => (
                <SetMiniCard key={s.id} set={s} Icon={LibraryIcon} onSelect={nav.goViewSet} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Recent activity */}
        {activities.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="Recent activity" />
            <Spacer size={spacing.md} />
            <View style={styles.activityList}>
              {activities.map(a => <ActivityItem key={a.id} activity={a} />)}
            </View>
          </>
        )}

        {/* Discover */}
        {publicSets.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="Discover" actionLabel="See all" onAction={nav.goPublicSets} />
            <Spacer size={spacing.md} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {publicSets.map(s => (
                <SetMiniCard key={s.id} set={s} Icon={SearchIcon} onSelect={nav.goViewSet} />
              ))}
            </ScrollView>
          </>
        )}

        <Spacer size={spacing.xxxl} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md },
  flex1: { flex: 1 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  greetingCol: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: { width: spacing.huge, height: spacing.huge, borderRadius: layout.pillRadius, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: spacing.s2, right: spacing.s2, minWidth: spacing.lg, height: spacing.lg,
    borderRadius: radius.sm, paddingHorizontal: spacing.s2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLeftPressed: { opacity: 0.7 },
  headerIconPressed: { opacity: 0.85 },

  // Featured card
  featured: { borderRadius: layout.cardRadiusLg, padding: spacing.xl, gap: spacing.sm },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
  featuredTitle: { marginTop: spacing.xs },
  progressTrack: { height: spacing.s6, borderRadius: spacing.s2, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: spacing.s6, borderRadius: spacing.s2 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },

  // Quick actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.xl },
  quickAction: { width: '25%', alignItems: 'center', gap: spacing.sm },
  quickCircle: {
    width: 56, height: 56, borderRadius: layout.pillRadius, // ponytail: off-grid circle size
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Section header
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAllPressed: { opacity: 0.7 },

  // Recent sets
  setsList: { gap: spacing.md },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: layout.cardRadiusSm, padding: spacing.lg,
  },
  setIcon: { width: spacing.huge, height: spacing.huge, borderRadius: layout.pillRadius, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dueBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
  cardShadow: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },

  // Summary stats
  summaryCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', rowGap: spacing.md },
  summaryStat: {
    width: '31%', aspectRatio: 1.4,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: layout.cardRadiusLg,
  },

  // Horizontal rails
  railContent: { gap: spacing.md, paddingRight: spacing.sm },
  miniCard: {
    width: 140, gap: spacing.sm, padding: spacing.lg, // ponytail: off-grid card width
    borderRadius: layout.cardRadiusSm, borderWidth: 1,
  },
  miniIcon: { width: 36, height: 36, borderRadius: layout.pillRadius, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, // ponytail: off-grid icon size
  miniTitle: { minHeight: 34 }, // ponytail: off-grid Figma value

  // Activity feed
  activityList: { gap: spacing.lg },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
