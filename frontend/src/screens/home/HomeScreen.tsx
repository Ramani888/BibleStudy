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
import Toast from 'react-native-toast-message';
import { DailyVerseCard, SetActionSheet, SetCard, CreditBadge } from '../../components/domain';
import { Avatar, Spacer, Typography } from '../../components/ui';
import { ConfirmDialog, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { useAuthStore } from '../../store';
import {
  useDailyVerse,
  useSets,
  useCreditBalance,
  useAutoDailyClaim,
  useDeleteSet,
  useConfirmDialog,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { AdBanner } from '../../ads/components/AdBanner';
import { colors, layout, spacing } from '../../theme';
import type { AppTabParamList } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;
const QUICK_ACTION_ICON_SIZE = 28;

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
  { label: 'Library', iconName: 'library-outline',    tab: 'LibraryTab', color: colors.info,    bg: colors.infoSurface    },
  { label: 'AI Chat', iconName: 'chatbubbles-outline', tab: 'AITab',      color: colors.primary, bg: colors.primarySurface },
  { label: 'Profile', iconName: 'person-outline',      tab: 'ProfileTab', color: colors.warning, bg: colors.warningSurface },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function QuickActionGrid() {
  const navigation = useNavigation<HomeNav>();
  return (
    <View style={styles.actionGrid}>
      {QUICK_ACTIONS.map(action => (
        <Pressable
          key={action.tab}
          accessibilityRole="button"
          accessibilityLabel={`Go to ${action.label}`}
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

  const {
    data: verse,
    isLoading: verseLoading,
    isError: verseError,
    refetch: refetchVerse,
  } = useDailyVerse();
  const {
    data: sets,
    isLoading: setsLoading,
    isRefetching: setsRefetching,
    isError: setsError,
    refetch: refetchSets,
  } = useSets();
  const { data: creditData, refetch: refetchCredits, isRefetching: creditsRefetching } = useCreditBalance();
  useAutoDailyClaim();

  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();

  const recentSets = sets?.slice(0, 3) ?? [];
  const totalCards = sets?.reduce((sum, s) => sum + (s._count?.cards ?? 0), 0) ?? 0;
  const refreshing = setsRefetching || creditsRefetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchSets(), refetchCredits()]);
  }, [refetchSets, refetchCredits]);

  const handleDeleteSet = (id: string, title: string) => {
    show({
      title: 'Delete Set',
      message: `Delete "${title}"? This will permanently remove all its cards.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(id);
          Toast.show({ type: 'success', text1: 'Set deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scrollView}
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
              {getGreeting()},
            </Typography>
            <Typography preset="h3" numberOfLines={1}>
              {user?.name?.split(' ')[0] ?? 'Friend'}
            </Typography>
          </View>
          <View style={styles.headerRight}>
            <CreditBadge balance={creditData?.balance ?? 0} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go to profile"
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <Avatar uri={user?.profileImage} name={user?.name} size="sm" />
            </Pressable>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Typography preset="h3" color={colors.primary}>
              {(setsLoading || setsError) ? '—' : (sets?.length ?? 0)}
            </Typography>
            <Typography preset="caption" color={colors.textSecondary}>Sets</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Typography preset="h3" color={colors.primary}>
              {(setsLoading || setsError) ? '—' : totalCards}
            </Typography>
            <Typography preset="caption" color={colors.textSecondary}>Cards</Typography>
          </View>
        </View>

        <Spacer size={spacing[5]} />

        {/* ── Daily Verse ── */}
        <Typography preset="h4" style={styles.sectionTitle}>
          Today's Verse
        </Typography>
        {verseError ? (
          <ErrorState
            message="Could not load today's verse."
            onRetry={refetchVerse}
            style={styles.inlineError}
          />
        ) : (
          <DailyVerseCard verse={verse} loading={verseLoading} />
        )}

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all sets"
            onPress={() => navigation.navigate('LibraryTab')}
          >
            <Typography preset="label" color={colors.primary}>
              See all
            </Typography>
          </Pressable>
        </View>

        <View style={styles.setsList}>
          {setsError ? (
            <ErrorState
              message="Could not load your sets."
              onRetry={refetchSets}
              style={styles.inlineError}
            />
          ) : setsLoading ? (
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
                accessibilityRole="button"
                accessibilityLabel="Create new set"
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

      <AdBanner />

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
        onDelete={() => selectedSet && handleDeleteSet(selectedSet.id, selectedSet.title)}
        isOwner={selectedSet?.userId === user?.id}
      />

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
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
    gap: spacing[3],
  },
  actionItem: {
    flex: 1,
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

  // Inline error state (used inside ScrollView — no flex expansion needed)
  inlineError: {
    paddingVertical: spacing[6],
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
