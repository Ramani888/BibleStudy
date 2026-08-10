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
import { useTheme, type Theme } from '../../theme';
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <View style={styles.header}>
      <Pressable style={styles.headerLeft} onPress={onAvatar} accessibilityRole="button" accessibilityLabel="Go to profile">
        <Avatar uri={avatarUri} name={name} size="sm" />
        <View style={styles.greetingCol}>
          <Typography preset="caption" color={colors.textSecondary}>{greeting},</Typography>
          <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{name}</Typography>
        </View>
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable onPress={onAI} hitSlop={8} style={styles.headerIconBtn} accessibilityRole="button" accessibilityLabel="AI Chat">
          <SparklesIcon size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={onBell} hitSlop={8} style={styles.headerIconBtn} accessibilityRole="button" accessibilityLabel="Notifications">
          <BellIcon size={20} color={colors.textPrimary} />
          {unread > 0 && (
            <View style={styles.bellBadge}>
              <Typography preset="caption" color={colors.textOnPrimary}>{unread > 9 ? '9+' : unread}</Typography>
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

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
    <AnimatedPressable style={styles.featured} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.featuredTop}>
        <View style={styles.badge}>
          <Typography preset="caption" color={colors.textOnPrimary}>{badge}</Typography>
        </View>
        <ArrowRightIcon size={18} color={colors.textOnPrimary} />
      </View>
      <Typography preset="h4" color={colors.textOnPrimary} numberOfLines={1} style={styles.featuredTitle}>{title}</Typography>
      <Typography preset="bodySm" color={colors.textOnPrimaryMuted}>{subtitle}</Typography>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(weekProgress * 100)}%` }]} />
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <AnimatedPressable style={styles.quickAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.quickCircle}>
        <Icon size={22} color={colors.textPrimary} />
      </View>
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </AnimatedPressable>
  );
}

// ─── Recent set row ───────────────────────────────────────────────────────────
function SetRow({ set, due, onPress }: { set: StudySet; due: boolean; onPress: () => void }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const count = set._count?.cards ?? 0;
  return (
    <AnimatedPressable style={styles.setRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${set.title}`}>
      <View style={styles.setIcon}>
        <LibraryIcon size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.flex1}>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>{set.title}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>{count} card{plural(count)}</Typography>
      </View>
      {due ? (
        <View style={styles.dueBadge}><Typography preset="caption" color={colors.success}>DUE</Typography></View>
      ) : (
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      )}
    </AnimatedPressable>
  );
}

// ─── Reusable mini set card (for the horizontal rails) ────────────────────────
function SetMiniCard({ set, Icon, onPress }: { set: StudySet; Icon: IconComponent; onPress: () => void }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const count = set._count?.cards ?? 0;
  return (
    <AnimatedPressable style={styles.miniCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${set.title}`}>
      <View style={styles.miniIcon}>
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <View style={styles.summaryCard}>
      {stats.map(s => (
        <View key={s.label} style={styles.summaryStat}>
          <Typography preset="h4" color={colors.textPrimary}>{s.value}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>{s.label}</Typography>
        </View>
      ))}
    </View>
  );
}

// ─── Verse card (purple box with big corner quote marks) ──────────────────────
function VerseCard({ text, reference }: { text?: string; reference?: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  if (!text || !reference) return null;
  return (
    <View style={styles.verseCard}>
      <Typography preset="verse" color={colors.textOnPrimary} style={[styles.quoteMark, styles.quoteTopLeft]}>“</Typography>
      <Typography preset="verse" color={colors.textOnPrimary} style={[styles.quoteMark, styles.quoteBottomRight]}>”</Typography>
      <Typography preset="verse" color={colors.textOnPrimary} style={styles.verseText}>{text}</Typography>
      <Typography preset="label" color={colors.textOnPrimaryMuted} style={styles.verseRef}>— {reference}</Typography>
    </View>
  );
}

function SectionRow({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  return (
    <View style={styles.sectionRow}>
      <Typography preset="h4" color={colors.textPrimary}>{title}</Typography>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8} style={styles.rowCenter} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Typography preset="label" color={colors.primary}>{actionLabel}</Typography>
          <ChevronRightIcon size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { spacing } = theme;

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StickyHeader
        greeting={getGreeting()}
        name={firstName}
        avatarUri={user?.profileImage}
        unread={notifData?.unreadCount ?? 0}
        onAI={() => navigation.navigate('AITab', { screen: 'AIChat' })}
        onBell={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })}
        onAvatar={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FeaturedCard due={dueSummary} continueSet={continueSet} streak={streak} onReview={goReview} onContinue={goContinue} onCreate={goCreate} />

        <Spacer size={spacing[6]} />
        <View style={styles.quickGrid}>
          {quickActions.map(a => (
            <QuickAction key={a.label} Icon={a.Icon} label={a.label} onPress={a.onPress} />
          ))}
        </View>

        {recentSets.length > 0 && (
          <>
            <Spacer size={spacing[6]} />
            <SectionRow title="My Sets" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'Library' })} />
            <Spacer size={spacing[3]} />
            <View style={styles.setsList}>
              {recentSets.map(s => (
                <SetRow key={s.id} set={s} due={dueSummary?.topSet?.id === s.id} onPress={() => goContinue(s)} />
              ))}
            </View>
          </>
        )}

        {/* Summary */}
        <Spacer size={spacing[6]} />
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
            <Spacer size={spacing[6]} />
            <SectionRow title="From your friends" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'FriendsSets' })} />
            <Spacer size={spacing[3]} />
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
            <Spacer size={spacing[6]} />
            <SectionRow title="Recent activity" />
            <Spacer size={spacing[3]} />
            <View style={styles.activityList}>
              {activities.map(a => <ActivityItem key={a.id} activity={a} />)}
            </View>
          </>
        )}

        {/* Discover */}
        {publicSets.length > 0 && (
          <>
            <Spacer size={spacing[6]} />
            <SectionRow title="Discover" actionLabel="See all" onAction={() => navigation.navigate('LibraryTab', { screen: 'PublicSets' })} />
            <Spacer size={spacing[3]} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
              {publicSets.map(s => (
                <SetMiniCard key={s.id} set={s} Icon={SearchIcon} onPress={() => navigation.navigate('LibraryTab', { screen: 'SetDetail', params: { setId: s.id, setTitle: s.title, isOwner: false } })} />
              ))}
            </ScrollView>
          </>
        )}

        {/* Daily verse */}
        <Spacer size={spacing[6]} />
        <VerseCard text={verse?.text} reference={verse?.reference} />

        <Spacer size={spacing[8]} />
      </ScrollView>

    </SafeAreaView>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scroll: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3] },
    flex1: { flex: 1 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
    greetingCol: { flex: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    headerIconBtn: {
      width: 40, height: 40, borderRadius: layout.pillRadius,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    bellBadge: {
      position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: spacing[2], paddingHorizontal: spacing[0.5],
      backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
    },

    // Featured card
    featured: {
      backgroundColor: colors.featuredSurface,
      borderRadius: layout.cardRadiusLg, padding: spacing[5], gap: spacing[2],
    },
    featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    badge: { backgroundColor: colors.success, borderRadius: spacing[2], paddingHorizontal: spacing[2], paddingVertical: spacing[1] / 2 },
    featuredTitle: { marginTop: spacing[1] },
    progressTrack: { height: 6, borderRadius: spacing[0.5], backgroundColor: colors.overlayLight, marginTop: spacing[2], overflow: 'hidden' },
    progressFill: { height: 6, borderRadius: spacing[0.5], backgroundColor: colors.success },
    featuredFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginTop: spacing[1] },

    // Quick actions
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing[5] },
    quickAction: { width: '25%', alignItems: 'center', gap: spacing[2] },
    quickCircle: {
      width: 56, height: 56, borderRadius: layout.pillRadius,
      borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },

    // Section
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    // Recent sets
    setsList: { gap: spacing[3] },
    setRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing[3],
      backgroundColor: colors.backgroundCard, borderRadius: layout.cardRadiusSm, padding: spacing[4],
    },
    setIcon: {
      width: 40, height: 40, borderRadius: layout.pillRadius,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    dueBadge: { backgroundColor: colors.successSurface, borderRadius: spacing[2], paddingHorizontal: spacing[2], paddingVertical: spacing[1] / 2 },

    // Horizontal rails (friends / groups / discover)
    railContent: { gap: spacing[3], paddingRight: spacing[2] },
    miniCard: {
      width: 140, gap: spacing[2], padding: spacing[4], borderRadius: layout.cardRadiusSm,
      backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.border,
    },
    miniIcon: {
      width: 36, height: 36, borderRadius: layout.pillRadius,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    miniTitle: { minHeight: 34 },

    // Summary — separate square boxes, 3 per row
    summaryCard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', rowGap: spacing[3] },
    summaryStat: {
      width: '31%', aspectRatio: 1.4,
      alignItems: 'center', justifyContent: 'center', gap: spacing[1],
      backgroundColor: colors.backgroundCard, borderRadius: layout.cardRadiusLg,
    },

    // Activity feed
    activityList: { gap: spacing[4] },
    activityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },

    // Verse card
    verseCard: {
      backgroundColor: colors.primary, borderRadius: layout.cardRadiusLg, minHeight: 190,
      paddingHorizontal: spacing[6], paddingVertical: spacing[7],
      justifyContent: 'center', gap: spacing[3], overflow: 'hidden',
    },
    verseText: { fontStyle: 'italic', textAlign: 'center' },
    verseRef: { textAlign: 'center' },
    quoteMark: { position: 'absolute', fontSize: 52, lineHeight: 56, opacity: 0.22 },
    quoteTopLeft: { top: spacing[2], left: spacing[4] },
    quoteBottomRight: { bottom: spacing[2], right: spacing[4] },
  });
