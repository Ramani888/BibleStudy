import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProfileScreenProps } from '../../navigation/types';
import type { Achievement, AchievementCategory } from '../../types';
import { useAchievements } from '../../hooks';
import { Typography } from '../../components/ui/Typography';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  AlbumsIcon, BackIcon, BookIcon, BookmarkIcon, BuildingIcon,
  CheckCircleIcon, CompassIcon, FlameIcon, FolderIcon, LockIcon,
  SparklesIcon, StarIcon, TrophyIcon, UsersIcon,
} from '../../components/icons';
import { useTheme, palette, spacing, layout, radius, CARD_FILL_LIGHT } from '../../theme';

const ICON_BY_KEY: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  card: BookmarkIcon, cards: AlbumsIcon, folder: FolderIcon, quiz: CompassIcon,
  star: StarIcon, compass: CompassIcon, flame: FlameIcon, users: UsersIcon,
  group: BuildingIcon, sparkles: SparklesIcon, book: BookIcon,
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  study: 'Study', quiz: 'Quiz', streak: 'Streak', social: 'Community', ai: 'AI',
};
const CATEGORY_ORDER: AchievementCategory[] = ['streak', 'study', 'quiz', 'ai', 'social'];

const AMBER      = '#F79009';
const AMBER_SOFT = 'rgba(247,144,9,0.15)';

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
} as const;

// ── Status badge ────────────────────────────────────────────────────────────

function StatusBadge({ achievement: a }: { achievement: Achievement }) {
  const { colors } = useTheme();
  const inProgress = !a.unlocked && a.progress > 0;

  if (a.unlocked) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
        <CheckCircleIcon size={13} color={colors.success} />
        <Typography preset="caption" color={colors.success}> +{a.reward}</Typography>
      </View>
    );
  }
  if (inProgress) {
    return (
      <View style={[styles.badge, { backgroundColor: AMBER_SOFT }]}>
        <Typography preset="caption" color={AMBER}>{a.progress}/{a.threshold}</Typography>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: colors.badgeLockedBg }]}>
      <LockIcon size={12} color={colors.textSecondary} />
      <Typography preset="caption" color={colors.textSecondary}> Locked</Typography>
    </View>
  );
}

// ── Achievement card ─────────────────────────────────────────────────────────

function AchievementCard({ achievement: a, colors, isDark }: { achievement: Achievement; colors: ReturnType<typeof useTheme>['colors']; isDark: boolean }) {
  const Icon = ICON_BY_KEY[a.icon] ?? TrophyIcon;
  const isLocked = !a.unlocked && a.progress === 0;

  return (
    <View style={[styles.card, !isDark && styles.cardShadow, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.cardBorder }]}>
      <View style={isLocked ? styles.cardLocked : undefined}>
        <View style={styles.cardTop}>
          <View style={styles.emojiBadge}>
            <Icon size={22} color={a.unlocked ? colors.accent : colors.textSecondary} />
          </View>
          <Typography preset="label" color={colors.textPrimary} style={styles.cardTitle} numberOfLines={2}>
            {a.title}
          </Typography>
          <StatusBadge achievement={a} />
        </View>

        <Typography preset="caption" color={colors.textSecondary} style={styles.cardDesc}>
          {a.description}
        </Typography>

        {!a.unlocked && a.threshold > 0 && (
          <>
            <View style={[styles.track, { backgroundColor: colors.sliderTrack }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.sliderFill,
                    width: `${Math.round(Math.min(a.progress / a.threshold, 1) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Typography preset="caption" color={colors.textSecondary} style={styles.progressText}>
              {a.progress} / {a.threshold}
            </Typography>
          </>
        )}
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export function AchievementsScreen({ navigation }: ProfileScreenProps<'Achievements'>) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const insets = useSafeAreaInsets();
  const { data: achievements = [], isLoading, error, refetch } = useAchievements();

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const remaining = achievements.length - unlockedCount;

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, Achievement[]>();
    for (const a of achievements) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c)! }));
  }, [achievements]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Indigo header ── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>

        {/* Back + title row */}
        <View style={styles.headerTop}>
          <Pressable onPress={navigation.goBack} hitSlop={10} style={styles.back}>
            <BackIcon size={24} color={palette.white} />
          </Pressable>
          <Typography preset="h4" color={palette.white}>Achievements</Typography>
        </View>

        {/* Trophy + stats */}
        <View style={styles.headerBody}>
          <View style={styles.trophyBadge}>
            <TrophyIcon size={36} color={palette.white} />
          </View>
          <View style={styles.headerStats}>
            <Typography preset="h2" color={palette.white}>{unlockedCount} unlocked</Typography>
            <Typography preset="caption" color="rgba(255,255,255,0.85)" style={styles.remainingText}>
              {remaining} remaining
            </Typography>
          </View>
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {achievements.map((a, i) => (
            <View
              key={i}
              style={[styles.dot, a.unlocked ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </View>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
        >
          {grouped.map(({ category, items }) => (
            <View key={category} style={styles.section}>
              <Typography preset="label" color={colors.textSecondary} style={styles.sectionTitle}>
                {CATEGORY_LABELS[category]}
              </Typography>
              {items.map(a => (
                <AchievementCard key={a.key} achievement={a} colors={colors} isDark={isDark} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: palette.indigo500,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 40,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  trophyBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.r45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStats: { flex: 1 },
  remainingText: { marginTop: spacing.s2, opacity: 0.85 },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.s18,
  },
  dot: {
    flex: 1,
    height: 6,
    borderRadius: radius.r3,
  },
  dotFilled: { backgroundColor: palette.white },
  dotEmpty:  { backgroundColor: 'rgba(255,255,255,0.25)' },

  // Scroll
  scroll: { paddingTop: spacing.xl },

  // Sections
  section: {
    marginTop: spacing.s28,
    paddingHorizontal: layout.screenPaddingH,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.s14,
    marginLeft: spacing.xs,
  },

  // Cards
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardShadow: CARD_SHADOW,
  cardLocked: { opacity: 0.6 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emojiBadge: {
    width: 28,
    alignItems: 'center',
  },
  cardTitle: { flex: 1 },
  cardDesc: {
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  track: {
    height: 4,
    borderRadius: radius.r2,
    marginTop: spacing.s14,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.r2,
  },
  progressText: {
    marginTop: spacing.sm,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s10,
    height: 24,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
});
