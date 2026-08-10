import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import type { Achievement, AchievementCategory } from '../../types';
import { useAchievements } from '../../hooks';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  AlbumsIcon, BookIcon, BookmarkIcon, BuildingIcon, CheckCircleIcon, CompassIcon,
  FlameIcon, FolderIcon, LockIcon, SparklesIcon, StarIcon, TrophyIcon, UsersIcon,
} from '../../components/icons';
import { type Theme, useTheme } from '../../theme';

const ICON_BY_KEY: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  card: BookmarkIcon, cards: AlbumsIcon, folder: FolderIcon, quiz: CompassIcon,
  star: StarIcon, compass: CompassIcon, flame: FlameIcon, users: UsersIcon,
  group: BuildingIcon, sparkles: SparklesIcon, book: BookIcon,
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  study: 'Study', quiz: 'Quiz', streak: 'Streak', social: 'Community', ai: 'AI',
};
const CATEGORY_ORDER: AchievementCategory[] = ['streak', 'study', 'quiz', 'ai', 'social'];

export function AchievementsScreen({ navigation }: ProfileScreenProps<'Achievements'>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: achievements = [], isLoading, error, refetch } = useAchievements();

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, Achievement[]>();
    for (const a of achievements) {
      if (!map.has(a.category)) map.set(a.category, []);
      map.get(a.category)!.push(a);
    }
    return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c)! }));
  }, [achievements]);

  return (
    <Screen header={<ScreenHeader title="Achievements" onBack={navigation.goBack} />}>
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={styles.summary}>
            <TrophyIcon size={28} color={colors.primary} />
            <View style={styles.summaryText}>
              <Typography preset="h3">{unlockedCount} of {achievements.length}</Typography>
              <Typography preset="caption" color={colors.textSecondary}>achievements unlocked</Typography>
            </View>
          </View>

          {grouped.map(({ category, items }, idx) => (
            <View key={category} style={styles.section}>
              <Typography preset="label" color={colors.textSecondary} style={styles.sectionLabel}>
                {CATEGORY_LABELS[category]}
              </Typography>
              {items.map(a => {
                const Icon = ICON_BY_KEY[a.icon] ?? TrophyIcon;
                return (
                  <View key={a.key} style={[styles.row, !a.unlocked && styles.rowLocked]}>
                    <View style={[styles.iconWrap, a.unlocked ? styles.iconWrapUnlocked : styles.iconWrapLocked]}>
                      {a.unlocked
                        ? <Icon size={22} color={colors.primary} />
                        : <LockIcon size={18} color={colors.textDisabled} />}
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTitleLine}>
                        <Typography preset="body" color={a.unlocked ? colors.textPrimary : colors.textSecondary}>
                          {a.title}
                        </Typography>
                        {a.unlocked
                          ? <View style={styles.unlockedTag}><CheckCircleIcon size={14} color={colors.success} /><Typography preset="caption" color={colors.success}> +{a.reward}</Typography></View>
                          : <Typography preset="caption" color={colors.textSecondary}>{a.progress}/{a.threshold}</Typography>}
                      </View>
                      <Typography preset="caption" color={colors.textSecondary}>{a.description}</Typography>
                      {!a.unlocked && (
                        <ProgressBar progress={a.threshold > 0 ? a.progress / a.threshold : 0} style={styles.progress} />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[8] },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.primarySurface, borderRadius: layout.cardRadius,
    borderWidth: 1, borderColor: colors.primaryLight, padding: spacing[4], marginBottom: spacing[5],
  },
  summaryText: { gap: spacing[0.5] },
  section: { marginBottom: spacing[5] },
  sectionLabel: { marginBottom: spacing[2], textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[3], alignItems: 'flex-start' },
  rowLocked: { opacity: 0.7 },
  iconWrap: { width: 44, height: 44, borderRadius: layout.cardRadius, alignItems: 'center', justifyContent: 'center' },
  iconWrapUnlocked: { backgroundColor: colors.primarySurface, borderWidth: 1, borderColor: colors.primaryLight },
  iconWrapLocked: { backgroundColor: colors.backgroundSecondary },
  rowBody: { flex: 1, gap: spacing[1] },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unlockedTag: { flexDirection: 'row', alignItems: 'center' },
  progress: { marginTop: spacing[1.5] },
});
