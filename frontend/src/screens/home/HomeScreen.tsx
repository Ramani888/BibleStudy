import React, { useCallback, useState } from 'react';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { DailyVerseCard, SetActionSheet, SetCard, CreditBadge } from '../../components/domain';
import { Avatar, Spacer, Typography } from '../../components/ui';

const ICON_SIZE = 20;
const QUICK_ACTION_ICON_SIZE = 28;
import { SetCardSkeleton } from '../../components/feedback';
import { useAuthStore } from '../../store';
import { useDailyVerse, useSets, useCreditBalance, useAutoDailyClaim } from '../../hooks';
import { colors, layout, spacing } from '../../theme';
import type { AppTabParamList } from '../../navigation/types';
import type { StudySet } from '../../types';

type HomeNav = BottomTabNavigationProp<AppTabParamList>;

type ParamlessTab = 'HomeTab' | 'LibraryTab' | 'AITab' | 'ProfileTab';

// ─── Quick action item ────────────────────────────────────────────────────────
interface QuickAction {
  label: string;
  iconName: string;
  tab: ParamlessTab;
  color: string;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Library', iconName: 'library-outline',     tab: 'LibraryTab', color: colors.info,    bg: colors.infoSurface    },
  { label: 'Study',   iconName: 'book-outline',         tab: 'LibraryTab', color: colors.success, bg: colors.successSurface },
  { label: 'AI Chat', iconName: 'chatbubbles-outline',  tab: 'AITab',      color: colors.primary, bg: colors.primarySurface },
  { label: 'Profile', iconName: 'person-outline',       tab: 'ProfileTab', color: colors.warning, bg: colors.warningSurface },
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
          <Icon name={action.iconName} size={QUICK_ACTION_ICON_SIZE} color={action.color} />
          <Typography preset="label" color={action.color}>
            {action.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<HomeNav>();
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);

  const { data: verse, isLoading: verseLoading, refetch: refetchVerse } = useDailyVerse();
  const { data: sets, isLoading: setsLoading, refetch: refetchSets } = useSets();
  const { data: creditData } = useCreditBalance();
  useAutoDailyClaim();

  const recentSets = sets?.slice(0, 3) ?? [];
  const totalCards = sets?.reduce((sum, s) => sum + (s._count?.cards ?? 0), 0) ?? 0;
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
              {user?.name?.split(' ')[0] ?? 'Friend'}
            </Typography>
          </View>
          <View style={styles.headerRight}>
            <CreditBadge balance={creditData?.balance ?? 0} />
            <Pressable onPress={() => navigation.navigate('ProfileTab')}>
              <Avatar uri={user?.profileImage} name={user?.name} size="sm" />
            </Pressable>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Typography preset="h3" color={colors.primary}>{sets?.length ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Sets</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Typography preset="h3" color={colors.primary}>{totalCards}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Cards</Typography>
          </View>
        </View>

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
                <View style={styles.createBtnContent}>
                  <Icon name="add" size={ICON_SIZE} color={colors.primary} />
                  <Typography preset="label" color={colors.primary}>New Set</Typography>
                </View>
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
                onMenuPress={() => setSelectedSet(set)}
              />
            ))
          )}
        </View>

        <Spacer size={spacing[8]} />
      </ScrollView>

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onStudy={() =>
          selectedSet &&
          navigation.navigate('LibraryTab', {
            screen: 'Study',
            params: { setId: selectedSet.id, setTitle: selectedSet.title },
          })
        }
        onCreateCard={() =>
          selectedSet &&
          navigation.navigate('LibraryTab', {
            screen: 'CreateCard',
            params: { setId: selectedSet.id },
          })
        }
        onEdit={() =>
          selectedSet &&
          navigation.navigate('LibraryTab', {
            screen: 'EditSet',
            params: { setId: selectedSet.id },
          })
        }
        onDelete={() => setSelectedSet(null)}
      />
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
  createBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[5],
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing[3] },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing[2] },

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
