import React, { useMemo } from 'react';
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
  BookIcon,
  CheckCircleIcon,
  SparklesIcon,
  FileTextIcon,
  FolderIcon,
  UsersIcon,
  SearchIcon,
  UserIcon,
  LibraryIcon,
  type IconComponent,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import {
  useSets,
  usePublicSets,
  useFriendsSets,
  useFriendsActivityFeed,
  useFriends,
  useFolders,
  useNotes,
  useCreditBalance,
  useDailyVerse,
  useAutoDailyClaim,
  useStreak,
  useDueSummary,
  useNotifications,
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

// ─── Sticky Header ────────────────────────────────────────────────────────────
function StickyHeader({ greeting, name, avatarUri, unread, onAI, onBell, onAvatar }: {
  greeting: string; name: string; avatarUri?: string | null; unread: number; onAI: () => void; onBell: () => void; onAvatar: () => void;
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
}

// ─── Featured card (bold dark hero) ───────────────────────────────────────────
function FeaturedCard({ due, continueSet, streak, onReview, onContinue, onCreate }: {
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
    <AnimatedPressable style={[styles.featured, { backgroundColor: colors.featuredSurface }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.featuredTop}>
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Typography preset="caption" color={colors.textOnAccent}>{badge}</Typography>
        </View>
        <ArrowRightIcon size={18} color={colors.textOnAccent} />
      </View>
      <Typography preset="h4" color={colors.textOnAccent} numberOfLines={1} style={styles.featuredTitle}>{title}</Typography>
      <Typography preset="bodySm" color={colors.textOnPrimaryMuted}>{subtitle}</Typography>

      <View style={[styles.progressTrack, { backgroundColor: colors.overlayLight }]}>
        <View style={[styles.progressFill, { width: `${Math.round(weekProgress * 100)}%`, backgroundColor: colors.success }]} />
      </View>
      <View style={styles.featuredFooter}>
        <FlameIcon size={14} color={colors.warning} />
        <Typography preset="caption" color={colors.textOnPrimaryMuted}>{streak} day streak · weekly goal {Math.min(streak, 7)}/7</Typography>
      </View>
    </AnimatedPressable>
  );
}

// ─── Circular quick action ────────────────────────────────────────────────────
function QuickAction({ Icon, label, onPress }: { Icon: IconComponent; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <AnimatedPressable style={styles.quickAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.quickCircle, { borderColor: colors.border }]}>
        <Icon size={22} color={colors.textPrimary} />
      </View>
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </AnimatedPressable>
  );
}

// ─── Recent set row ───────────────────────────────────────────────────────────
function SetRow({ set, due, onPress }: { set: StudySet; due: boolean; onPress: () => void }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const count = set._count?.cards ?? 0;
  return (
    <AnimatedPressable style={[styles.setRow, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, !isDark && styles.cardShadow]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${set.title}`}>
      <View style={[styles.setIcon, { borderColor: colors.border }]}>
        <LibraryIcon size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.flex1}>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{set.title}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>{count} card{plural(count)}</Typography>
      </View>
      {due ? (
        <View style={[styles.dueBadge, { backgroundColor: colors.successSoft }]}><Typography preset="caption" color={colors.success}>DUE</Typography></View>
      ) : (
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      )}
    </AnimatedPressable>
  );
}

// ─── Reusable mini set card (for the horizontal rails) ────────────────────────
function SetMiniCard({ set, Icon, onPress }: { set: StudySet; Icon: IconComponent; onPress: () => void }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const count = set._count?.cards ?? 0;
  return (
    <AnimatedPressable style={[styles.miniCard, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }, !isDark && styles.cardShadow]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${set.title}`}>
      <View style={[styles.miniIcon, { borderColor: colors.border }]}>
        <Icon size={18} color={colors.textPrimary} />
      </View>
      <Typography preset="label" color={colors.textPrimary} numberOfLines={2} style={styles.miniTitle}>{set.title}</Typography>
      <Typography preset="caption" color={colors.textSecondary}>{count} card{plural(count)}</Typography>
    </AnimatedPressable>
  );
}


// ─── Activity feed item ───────────────────────────────────────────────────────
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

function ActivityItem({ activity }: { activity: Activity }) {
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
}

// ─── Summary card (Friends · Folders · Sets · Cards · Credits · Groups) ────────
function SummaryCard({ stats }: { stats: Array<{ value: number; label: string }> }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  return (
    <View style={styles.summaryCard}>
      {stats.map(s => (
        <View key={s.label} style={[styles.summaryStat, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, !isDark && styles.cardShadow]}>
          <Typography preset="h4" color={colors.textPrimary}>{s.value}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>{s.label}</Typography>
        </View>
      ))}
    </View>
  );
}

// ─── Verse card (purple box with big corner quote marks) ──────────────────────
function VerseCard({ text, reference }: { text?: string; reference?: string }) {
  const { colors } = useTheme();
  if (!text || !reference) return null;
  return (
    <View style={[styles.verseCard, { backgroundColor: colors.accent }]}>
      <Typography preset="verse" color={colors.textOnAccent} style={[styles.quoteMark, styles.quoteTopLeft]}>"</Typography>
      <Typography preset="verse" color={colors.textOnAccent} style={[styles.quoteMark, styles.quoteBottomRight]}>"</Typography>
      <Typography preset="verse" color={colors.textOnAccent} style={styles.verseText}>{text}</Typography>
      <Typography preset="label" color={colors.textOnPrimaryMuted} style={styles.verseRef}>— {reference}</Typography>
    </View>
  );
}

function SectionRow({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
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
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
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
  const { data: verse } = useDailyVerse();
  const { data: streakData } = useStreak();
  const { data: dueSummary } = useDueSummary();
  const { data: notifData } = useNotifications(1);
  useAutoDailyClaim();

  const publicSets = useMemo(() => (publicData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [publicData]);
  const friendsSets = useMemo(() => (friendsData?.pages.flatMap(p => p.sets) ?? []).slice(0, 8), [friendsData]);
  const activities = useMemo(() => (activityData?.pages.flatMap(p => p.activities) ?? []).slice(0, 5), [activityData]);
  const streak = streakData?.streak ?? 0;
  const firstName = user?.name?.split(' ')[0] ?? 'Friend';
  const continueSet = sets?.[0] ?? null;
  const cardTotal = useMemo(() => (sets ?? []).reduce((sum, x) => sum + (x._count?.cards ?? 0), 0), [sets]);
  const recentSets = useMemo(
    () => [...(sets ?? [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4),
    [sets],
  );

  const goReview = (setId: string, setTitle: string) =>
    navigation.navigate('QuizTab', { screen: 'QuizSetup', params: { preSelectedSetIds: [setId], preSelectedSetTitles: [setTitle] } });
  const goContinue = (s: StudySet) => navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title } });
  const goCreate = () => navigation.navigate('LibraryTab', { screen: 'CreateSet', params: {} });

  const quickActions: Array<{ label: string; Icon: IconComponent; onPress: () => void }> = [
    { label: 'Library', Icon: LibraryIcon, onPress: () => navigation.navigate('LibraryTab', { screen: 'Library' }) },
    { label: 'Quiz', Icon: CheckCircleIcon, onPress: () => navigation.navigate('QuizTab', { screen: 'QuizHub' }) },
    { label: 'AI Chat', Icon: SparklesIcon, onPress: () => navigation.navigate('AITab', { screen: 'AIChat' }) },
    { label: 'Notes', Icon: FileTextIcon, onPress: () => navigation.navigate('ProfileTab', { screen: 'Notes' }) },
    { label: 'Media', Icon: FolderIcon, onPress: () => navigation.navigate('ProfileTab', { screen: 'Media' }) },
    { label: 'Discover', Icon: SearchIcon, onPress: () => navigation.navigate('LibraryTab', { screen: 'PublicSets' }) },
    { label: 'Friends', Icon: UsersIcon, onPress: () => navigation.navigate('ProfileTab', { screen: 'Friends' }) },
    { label: 'Profile', Icon: UserIcon, onPress: () => navigation.navigate('ProfileTab', { screen: 'Profile' }) },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StickyHeader
        greeting={getGreeting()}
        name={firstName}
        avatarUri={user?.profileImage}
        unread={notifData?.unreadCount ?? 0}
        onAI={() => navigation.navigate('AITab', { screen: 'AIChat' })}
        onBell={() => navigation.navigate('ProfileTab', { screen: 'Notifications', params: { from: 'Home' } })}
        onAvatar={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FeaturedCard due={dueSummary} continueSet={continueSet} streak={streak} onReview={goReview} onContinue={goContinue} onCreate={goCreate} />

        <Spacer size={spacing.xxl} />
        <View style={styles.quickGrid}>
          {quickActions.map(a => (
            <QuickAction key={a.label} Icon={a.Icon} label={a.label} onPress={a.onPress} />
          ))}
        </View>

        {recentSets.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="My Sets" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'Library' })} />
            <Spacer size={spacing.md} />
            <View style={styles.setsList}>
              {recentSets.map(s => (
                <SetRow key={s.id} set={s} due={dueSummary?.topSet?.id === s.id} onPress={() => goContinue(s)} />
              ))}
            </View>
          </>
        )}

        {/* Summary */}
        <Spacer size={spacing.xxl} />
        <SummaryCard stats={[
          { value: friends?.length ?? 0, label: 'Friends' },
          { value: folders?.length ?? 0, label: 'Folders' },
          { value: sets?.length ?? 0, label: 'Sets' },
          { value: cardTotal, label: 'Cards' },
          { value: creditData?.balance ?? 0, label: 'Credits' },
          { value: notes?.length ?? 0, label: 'Notes' },
        ]} />

        {/* From your friends */}
        {friendsSets.length > 0 && (
          <>
            <Spacer size={spacing.xxl} />
            <SectionRow title="From your friends" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'FriendsSets' })} />
            <Spacer size={spacing.md} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {friendsSets.map(s => (
                <SetMiniCard key={s.id} set={s} Icon={LibraryIcon} onPress={() => navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title, isOwner: false } })} />
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
            <SectionRow title="Discover" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'PublicSets' })} />
            <Spacer size={spacing.md} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {publicSets.map(s => (
                <SetMiniCard key={s.id} set={s} Icon={SearchIcon} onPress={() => navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title, isOwner: false } })} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Daily verse */}
        <Spacer size={spacing.xxl} />
        <VerseCard text={verse?.text} reference={verse?.reference} />

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  greetingCol: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: layout.pillRadius,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: radius.sm, paddingHorizontal: spacing.s2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerLeftPressed: { opacity: 0.7 },
  headerIconPressed: { opacity: 0.85 },

  // Featured card
  featured: {
    borderRadius: layout.cardRadiusLg, padding: spacing.xl, gap: spacing.sm,
  },
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
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Section
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Recent sets
  setsList: { gap: spacing.md },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: layout.cardRadiusSm, padding: spacing.lg,
  },
  setIcon: {
    width: 40, height: 40, borderRadius: layout.pillRadius,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  dueBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs / 2 },
  seeAllPressed: { opacity: 0.7 },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // Horizontal rails
  railContent: { gap: spacing.md, paddingRight: spacing.sm },
  miniCard: {
    width: 140, gap: spacing.sm, padding: spacing.lg, borderRadius: layout.cardRadiusSm, // ponytail: off-grid card width
    borderWidth: 1,
  },
  miniIcon: {
    width: 36, height: 36, borderRadius: layout.pillRadius,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  miniTitle: { minHeight: 34 }, // ponytail: off-grid Figma value

  // Summary — separate square boxes, 3 per row
  summaryCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', rowGap: spacing.md },
  summaryStat: {
    width: '31%', aspectRatio: 1.4,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: layout.cardRadiusLg,
  },

  // Activity feed
  activityList: { gap: spacing.lg },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  // Verse card
  verseCard: {
    borderRadius: layout.cardRadiusLg, minHeight: 190,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.s28,
    justifyContent: 'center', gap: spacing.md, overflow: 'hidden',
  },
  verseText: { fontStyle: 'italic', textAlign: 'center' },
  verseRef: { textAlign: 'center' },
  quoteMark: { position: 'absolute', fontSize: 52, lineHeight: 56, opacity: 0.22 }, // ponytail: off-grid Figma values
  quoteTopLeft: { top: spacing.sm, left: spacing.lg },
  quoteBottomRight: { bottom: spacing.sm, right: spacing.lg },
});
