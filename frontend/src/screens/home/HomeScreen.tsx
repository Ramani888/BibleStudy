import React, { useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';

import { DailyVerseCard, SetCard, CreditBadge } from '../../components/domain';
import { Avatar, Spacer, Typography } from '../../components/ui';
import { SetCardSkeleton } from '../../components/feedback';
import { useAuthStore } from '../../store';
import { useDailyVerse, useSets, useClaimDailyLogin } from '../../hooks';
import { useFriendsActivityFeed } from '../../hooks/useActivities';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { colors, layout, spacing } from '../../theme';
import type { AppTabParamList } from '../../navigation/types';
import type { Activity, ActivityType } from '../../types/activities.types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

// Tabs that can be navigated to without required params from the home screen.
// StudyTab intentionally excluded — it requires a setId (pick a set from Library first).
type ParamlessTab = 'HomeTab' | 'LibraryTab' | 'AITab' | 'ProfileTab';

// ─── Quick action item ────────────────────────────────────────────────────────
interface QuickAction {
  label: string;
  emoji: string;
  tab: ParamlessTab;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Library', emoji: '◫', tab: 'LibraryTab', color: colors.info, bg: colors.infoSurface },
  { label: 'Study', emoji: '◈', tab: 'LibraryTab', color: colors.success, bg: colors.successSurface },
  { label: 'AI Chat', emoji: '◎', tab: 'AITab', color: colors.primary, bg: colors.primarySurface },
  { label: 'Profile', emoji: '◉', tab: 'ProfileTab', color: colors.warning, bg: colors.warningSurface },
];

function QuickActionGrid() {
  const navigation = useNavigation<HomeNav>();
  return (
    <View style={styles.actionGrid}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.tab}
          style={({ pressed }) => [
            styles.actionItem,
            { backgroundColor: action.bg, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => navigation.navigate(action.tab)}
        >
          <Typography style={[styles.actionEmoji, { color: action.color }]}>
            {action.emoji}
          </Typography>
          <Typography preset="label" color={action.color}>
            {action.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Daily login claim button ─────────────────────────────────────────────────
function DailyLoginButton() {
  const { mutate, isPending } = useClaimDailyLogin();

  const handleClaim = () => {
    mutate(undefined, {
      onSuccess: data => {
        Toast.show({
          type: 'success',
          text1: `+${data.transaction.amount} credit claimed!`,
          text2: `Your balance is now ${data.balance}`,
        });
      },
      onError: err => {
        Toast.show({
          type: 'error',
          text1: 'Already claimed today',
          text2: getErrorMessage(err),
        });
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.claimBtn, { opacity: pressed || isPending ? 0.65 : 1 }]}
      onPress={handleClaim}
      disabled={isPending}
    >
      <Typography preset="label" color={colors.primary}>
        {isPending ? 'Claiming…' : '✦ Claim daily credit'}
      </Typography>
    </Pressable>
  );
}

// ─── Activity label ────────────────────────────────────────────────────────────
function activityLabel(type: ActivityType): string {
  switch (type) {
    case 'ADDED_FRIEND':    return 'made a new friend';
    case 'JOINED_GROUP':    return 'joined a group';
    case 'JOINED_GATHERING':return 'joined a gathering';
    case 'CREATED_SET':     return 'created a study set';
    case 'STUDIED_CARDS':   return 'studied some flashcards';
    case 'CREATED_NOTE':    return 'created a note';
  }
}

// ─── Activity item ─────────────────────────────────────────────────────────────
function ActivityItem({ item }: { item: Activity }) {
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityDot} />
      <View style={styles.activityContent}>
        <Typography preset="bodySm">
          <Typography preset="bodySm" style={styles.activityName}>
            {item.user.name}
          </Typography>
          {' '}{activityLabel(item.type)}
        </Typography>
        <Typography preset="caption" color={colors.textDisabled}>
          {formatDate(item.createdAt)}
        </Typography>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();

  const { data: verse, isLoading: verseLoading, refetch: refetchVerse } = useDailyVerse();
  const { data: sets, isLoading: setsLoading, refetch: refetchSets } = useSets();
  const { data: activityData, refetch: refetchActivities } = useFriendsActivityFeed();

  const recentSets = sets?.slice(0, 3) ?? [];
  const recentActivities = activityData?.pages[0]?.activities.slice(0, 5) ?? [];
  const refreshing = verseLoading || setsLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchVerse(), refetchSets(), refetchActivities()]);
  }, [refetchVerse, refetchSets, refetchActivities]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.greetingCol}>
            <Typography preset="bodySm" color={colors.textSecondary}>
              {greeting()},
            </Typography>
            <Typography preset="h3" numberOfLines={1}>
              {user?.name?.split(' ')[0] ?? 'Friend'} 👋
            </Typography>
          </View>
          <View style={styles.headerRight}>
            <CreditBadge balance={user?.creditBalance ?? 0} />
            <Pressable onPress={() => navigation.navigate('ProfileTab')}>
              <Avatar uri={user?.profileImage} name={user?.name} size="sm" />
            </Pressable>
          </View>
        </View>

        {/* ── Daily Login ── */}
        <DailyLoginButton />

        <Spacer size={spacing[5]} />

        {/* ── Daily Verse ── */}
        <Typography preset="h4" style={styles.sectionTitle}>
          Today's Verse
        </Typography>
        <DailyVerseCard verse={verse} loading={verseLoading} />

        <Spacer size={spacing[6]} />

        {/* ── Quick Actions ── */}
        <Typography preset="h4" style={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <QuickActionGrid />

        <Spacer size={spacing[6]} />

        {/* ── Recent Sets ── */}
        <View style={styles.sectionHeader}>
          <Typography preset="h4">Recent Sets</Typography>
          <Pressable onPress={() => navigation.navigate('LibraryTab')}>
            <Typography preset="label" color={colors.primary}>
              See all
            </Typography>
          </Pressable>
        </View>

        <View style={styles.setsList}>
          {setsLoading ? (
            <>
              <SetCardSkeleton />
              <SetCardSkeleton />
            </>
          ) : recentSets.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Typography preset="body" color={colors.textSecondary} align="center">
                No sets yet. Create your first study set!
              </Typography>
              <Spacer size={spacing[3]} />
              <Pressable
                style={styles.createBtn}
                onPress={() => navigation.navigate('LibraryTab')}
              >
                <Typography preset="label" color={colors.primary}>
                  + New Set
                </Typography>
              </Pressable>
            </View>
          ) : (
            recentSets.map(set => (
              <SetCard
                key={set.id}
                set={set}
                onPress={() =>
                  navigation.navigate('LibraryTab', {
                    screen: 'SetDetail',
                    params: { setId: set.id, setTitle: set.title },
                  })
                }
              />
            ))
          )}
        </View>

        {/* ── Community Activity ── */}
        {recentActivities.length > 0 && (
          <>
            <Spacer size={spacing[6]} />
            <View style={styles.sectionHeader}>
              <Typography preset="h4">Community Activity</Typography>
              <Pressable onPress={() => navigation.navigate('ProfileTab')}>
                <Typography preset="label" color={colors.primary}>
                  Friends
                </Typography>
              </Pressable>
            </View>
            <View style={styles.activityList}>
              {recentActivities.map(activity => (
                <ActivityItem key={activity.id} item={activity} />
              ))}
            </View>
          </>
        )}

        <Spacer size={spacing[8]} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingH },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  greetingCol: { flex: 1, marginRight: spacing[3] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },

  // Daily login
  claimBtn: {
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
  },

  // Section
  sectionTitle: { marginBottom: spacing[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },

  // Quick actions
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  actionItem: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
  },
  actionEmoji: {
    fontSize: 28,
    lineHeight: 36,
  },

  // Sets
  setsList: { gap: spacing[3] },

  // Activity feed
  activityList: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  activityContent: { flex: 1, gap: spacing[0.5] },
  activityName: { fontWeight: '600' as const },
  emptyWrap: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  createBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
});
