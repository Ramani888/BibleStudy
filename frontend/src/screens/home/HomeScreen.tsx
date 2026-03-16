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
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { AppTabParamList } from '../../navigation/types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

// ─── Quick action item ────────────────────────────────────────────────────────
interface QuickAction {
  label: string;
  emoji: string;
  tab: keyof AppTabParamList;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Library', emoji: '◫', tab: 'LibraryTab', color: colors.info, bg: colors.infoSurface },
  { label: 'Study', emoji: '◈', tab: 'StudyTab', color: colors.success, bg: colors.successSurface },
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
          onPress={() => navigation.navigate(action.tab as any)}
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
          text1: `+${data.credited} credit claimed!`,
          text2: `Your balance is now ${data.newBalance}`,
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

// ─── Main screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();

  const { data: verse, isLoading: verseLoading, refetch: refetchVerse } = useDailyVerse();
  const { data: sets, isLoading: setsLoading, refetch: refetchSets } = useSets();

  const recentSets = sets?.slice(0, 3) ?? [];
  const refreshing = verseLoading || setsLoading;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchVerse(), refetchSets()]);
  }, [refetchVerse, refetchSets]);

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
                  } as any)
                }
              />
            ))
          )}
        </View>

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
