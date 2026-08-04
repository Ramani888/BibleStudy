import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { SetActionSheet, SetCard, CreditBadge } from '../../components/domain';
import { Avatar, Spacer, Typography, AnimatedPressable } from '../../components/ui';
import { ConfirmDialog, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { useAuthStore } from '../../store';
import {
  useDailyVerse,
  useSets,
  useCreditBalance,
  useAutoDailyClaim,
  useDeleteSet,
  useConfirmDialog,
  useStreak,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { AppTabParamList } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;
const QUICK_ACTION_ICON_SIZE = 26;

type HomeNav = BottomTabNavigationProp<AppTabParamList>;
type ParamlessTab = 'HomeTab' | 'LibraryTab' | 'AITab' | 'ProfileTab';

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

const VERSE_GRADIENT: [string, string, string] = ['#F4DFA0', '#D4990E', '#7D5606'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Streak Badge ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number | undefined }) {
  return (
    <View style={styles.streakBadge}>
      <Typography preset="label" color={streak ? colors.warning : colors.textSecondary}>
        🔥 {streak ?? '—'}
      </Typography>
    </View>
  );
}

// ─── Hero Verse Card ──────────────────────────────────────────────────────────
interface HeroVerseCardProps {
  text?: string;
  reference?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function HeroVerseCard({ text, reference, loading, error, onRetry }: HeroVerseCardProps) {
  if (loading) {
    return (
      <LinearGradient colors={VERSE_GRADIENT} style={styles.heroCard}>
        <View style={styles.heroLabelRow}>
          <View style={[styles.heroLabelDot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          <View style={{ width: 120, height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5 }} />
        </View>
        <Spacer size={spacing[4]} />
        <View style={{ width: '90%', height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6 }} />
        <Spacer size={spacing[2]} />
        <View style={{ width: '80%', height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6 }} />
        <Spacer size={spacing[2]} />
        <View style={{ width: '65%', height: 16, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 6 }} />
        <Spacer size={spacing[4]} />
        <View style={{ width: 100, height: 11, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, alignSelf: 'flex-end' }} />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={VERSE_GRADIENT} style={styles.heroCard}>
        <View style={styles.heroErrorWrap}>
          <Icon name="cloud-offline-outline" size={28} color="rgba(255,255,255,0.7)" />
          <Spacer size={spacing[2]} />
          <Typography preset="bodySm" color="rgba(255,255,255,0.85)">
            Could not load today's verse
          </Typography>
          {onRetry && (
            <Pressable onPress={onRetry} style={styles.heroRetryBtn} accessibilityRole="button">
              <Typography preset="label" color={colors.palette.white}>Try again</Typography>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    );
  }

  if (!text || !reference) return null;

  return (
    <LinearGradient colors={VERSE_GRADIENT} style={styles.heroCard}>
      <View style={styles.heroLabelRow}>
        <View style={styles.heroLabelDot} />
        <Typography preset="caption" color="rgba(255,255,255,0.85)" style={styles.heroLabelText}>
          VERSE OF THE DAY
        </Typography>
      </View>
      <Spacer size={spacing[4]} />
      <Typography preset="bodyLg" color={colors.palette.white} style={styles.heroVerseText}>
        "{text}"
      </Typography>
      <Spacer size={spacing[3]} />
      <Typography preset="label" color="rgba(255,255,255,0.75)" style={styles.heroReference}>
        — {reference}
      </Typography>
    </LinearGradient>
  );
}

// ─── Stat Chip (with value-change pop animation) ──────────────────────────────
interface StatChipProps {
  iconName: string;
  value: string | number;
  label: string;
  iconColor: string;
}

function StatChip({ iconName, value, label, iconColor }: StatChipProps) {
  const scale = useSharedValue(1);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      scale.value = withSequence(
        withTiming(1.08, { duration: 120 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
    }
  }, [value]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statChip, animStyle]}>
      <Icon name={iconName} size={18} color={iconColor} />
      <Typography preset="h4" color={colors.textPrimary}>{value}</Typography>
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </Animated.View>
  );
}

// ─── Quick Action Grid ────────────────────────────────────────────────────────
function QuickActionGrid() {
  const navigation = useNavigation<HomeNav>();
  return (
    <View style={styles.actionGrid}>
      {QUICK_ACTIONS.map(action => (
        <AnimatedPressable
          key={action.tab}
          accessibilityRole="button"
          accessibilityLabel={`Go to ${action.label}`}
          style={[styles.actionItem, { backgroundColor: action.bg }]}
          onPress={() => navigation.navigate(action.tab)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: action.color + '20' }]}>
            <Icon name={action.iconName} size={QUICK_ACTION_ICON_SIZE} color={action.color} />
          </View>
          <Typography preset="label" color={action.color}>{action.label}</Typography>
        </AnimatedPressable>
      ))}
    </View>
  );
}

// ─── Continue Studying Card ───────────────────────────────────────────────────
interface ContinueStudyingCardProps {
  set: StudySet;
  onPress: () => void;
  onMenuPress: () => void;
}

function ContinueStudyingCard({ set, onPress, onMenuPress }: ContinueStudyingCardProps) {
  const cardCount = set._count?.cards ?? 0;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Continue studying ${set.title}`}
      style={styles.continueCard}
      onPress={onPress}
    >
      <View style={styles.continueIconWrap}>
        <Icon name="book-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.continueContent}>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1}>
          {set.title}
        </Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {cardCount} {cardCount === 1 ? 'card' : 'cards'} · {formatDate(set.updatedAt)}
        </Typography>
      </View>
      <View style={styles.continueRight}>
        <View style={styles.continueStudyBtn}>
          <Typography preset="label" color={colors.primary}>Study</Typography>
          <Icon name="arrow-forward" size={13} color={colors.primary} />
        </View>
        <Pressable
          onPress={onMenuPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <Icon name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
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
  const { data: streakData, isLoading: streakLoading } = useStreak();
  useAutoDailyClaim();

  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();

  const streak = streakData?.streak;
  const continueSet = sets?.[0] ?? null;
  const recentSets = sets?.slice(1, 3) ?? [];
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.greetingCol}>
            <Typography preset="bodySm" color={colors.textSecondary}>{getGreeting()},</Typography>
            <Typography preset="h3" numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'Friend'}</Typography>
          </View>
          <View style={styles.headerRight}>
            <StreakBadge streak={streak} />
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

        {/* ── Hero Verse ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <HeroVerseCard
            text={verse?.text}
            reference={verse?.reference}
            loading={verseLoading}
            error={verseError}
            onRetry={refetchVerse}
          />
        </Animated.View>

        <Spacer size={spacing[5]} />

        {/* ── Stats Row ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statsRow}>
          <StatChip
            iconName="layers-outline"
            value={(setsLoading || setsError) ? '—' : (sets?.length ?? 0)}
            label="Sets"
            iconColor={colors.info}
          />
          <StatChip
            iconName="copy-outline"
            value={(setsLoading || setsError) ? '—' : totalCards}
            label="Cards"
            iconColor={colors.primary}
          />
          <StatChip
            iconName="flame-outline"
            value={streakLoading ? '—' : (streak ?? 0)}
            label="Streak"
            iconColor={colors.warning}
          />
        </Animated.View>

        <Spacer size={spacing[6]} />

        {/* ── Quick Actions ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Typography preset="h4" style={styles.sectionTitle}>Quick Actions</Typography>
          <QuickActionGrid />
        </Animated.View>

        <Spacer size={spacing[6]} />

        {/* ── Sets Section ── */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <View style={styles.sectionHeader}>
            <Typography preset="h4">My Sets</Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all sets"
              onPress={() => navigation.navigate('LibraryTab')}
            >
              <Typography preset="label" color={colors.primary}>See all</Typography>
            </Pressable>
          </View>

          {setsError ? (
            <ErrorState
              message="Could not load your sets."
              onRetry={refetchSets}
              style={styles.inlineError}
            />
          ) : setsLoading ? (
            <View style={styles.setsList}>
              <SetCardSkeleton />
              <SetCardSkeleton />
            </View>
          ) : sets?.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="book-outline" size={32} color={colors.textDisabled} />
              <Spacer size={spacing[3]} />
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
            <>
              {continueSet && (
                <ContinueStudyingCard
                  set={continueSet}
                  onPress={() =>
                    navigation.navigate('LibraryTab', {
                      screen: 'SetDetail',
                      params: { setId: continueSet.id, setTitle: continueSet.title },
                    })
                  }
                  onMenuPress={() => setSelectedSet(continueSet)}
                />
              )}
              {recentSets.length > 0 && (
                <>
                  <Spacer size={spacing[3]} />
                  <Typography preset="caption" color={colors.textSecondary} style={styles.moreLabel}>
                    MORE SETS
                  </Typography>
                  <Spacer size={spacing[2]} />
                  <View style={styles.setsList}>
                    {recentSets.map(set => (
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
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </Animated.View>

        <Spacer size={spacing[8]} />
      </ScrollView>

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onQuiz={() =>
          selectedSet &&
          navigation.navigate('QuizTab', {
            screen: 'QuizModePicker',
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
    marginBottom: spacing[5],
  },
  greetingCol: { flex: 1, marginRight: spacing[3] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },

  // Streak badge
  streakBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.warningSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.palette.yellow500 + '40',
  },

  // Hero verse
  heroCard: {
    borderRadius: 14,
    padding: spacing[5],
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  heroLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  heroLabelText: {
    letterSpacing: 1,
  },
  heroVerseText: {
    fontStyle: 'italic',
    lineHeight: 28,
  },
  heroReference: {
    textAlign: 'right',
  },
  heroErrorWrap: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  heroRetryBtn: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    paddingVertical: spacing[4],
    alignItems: 'center',
    gap: spacing[1],
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Quick actions
  actionGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section headings
  sectionTitle: { marginBottom: spacing[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  moreLabel: { letterSpacing: 0.8 },

  // Continue studying
  continueCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryLight + '60',
  },
  continueContent: {
    flex: 1,
    gap: spacing[1],
  },
  continueRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  continueStudyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  // Sets list
  setsList: { gap: spacing[3] },

  // Empty state
  emptyWrap: {
    padding: spacing[6],
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
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
  createBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

  // Inline error
  inlineError: {
    paddingVertical: spacing[6],
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
