import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { EmptyState, ErrorState } from '../../components/feedback';
import { Typography } from '../../components/ui';
import { useSets, useAllQuizBest } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { QuizScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

type Props = QuizScreenProps<'QuizHub'>;

export function QuizHubScreen({ navigation }: Props) {
  const { data: sets = [], isLoading, isError, error, refetch, isFetching } = useSets();
  const { data: bestScores = [] } = useAllQuizBest();

  const bestBySet = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of bestScores) map[b.setId] = b.best;
    return map;
  }, [bestScores]);

  const renderItem = ({ item }: { item: StudySet }) => {
    const count = item._count?.cards ?? 0;
    const quizzable = count > 0;
    const best = bestBySet[item.id];

    return (
      <Pressable
        disabled={!quizzable}
        onPress={() => navigation.navigate('QuizModePicker', { setId: item.id, setTitle: item.title })}
        style={[styles.row, !quizzable && styles.rowDisabled]}
        accessibilityRole="button"
      >
        <View style={styles.rowIcon}>
          <Icon name="help-circle" size={22} color={quizzable ? colors.primary : colors.textDisabled} />
        </View>
        <View style={styles.rowText}>
          <Typography preset="h4" color={colors.textPrimary} numberOfLines={1}>{item.title}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>
            {quizzable ? `${count} ${count === 1 ? 'card' : 'cards'}` : 'No cards yet'}
          </Typography>
        </View>
        {best !== undefined && (
          <View style={styles.bestBadge}>
            <Icon name="trophy" size={12} color={colors.warning} />
            <Typography preset="caption" color={colors.warning}>{best}%</Typography>
          </View>
        )}
        {quizzable && <Icon name="chevron-forward" size={18} color={colors.textDisabled} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Typography preset="h2">Quiz</Typography>
        <Typography preset="body" color={colors.textSecondary}>Pick a set to test yourself</Typography>
      </View>

      <FlatList
        data={sets}
        keyExtractor={s => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          ) : !isLoading ? (
            <EmptyState
              title="No sets to quiz yet"
              subtitle="Create a set with cards to start quizzing"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3], paddingBottom: spacing[2] },
  list: { padding: layout.screenPaddingH, gap: spacing[3], flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowDisabled: { opacity: 0.55 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySurface,
  },
  rowText: { flex: 1, gap: spacing[0.5] },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 999,
    backgroundColor: colors.warningSurface,
  },
});
