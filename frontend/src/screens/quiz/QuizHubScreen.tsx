import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ActionSheet, EmptyState, ErrorState } from '../../components/feedback';
import { Button, Screen, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, EyeIcon, ListIcon, MoreVerticalIcon, RefreshIcon, TrashIcon } from '../../components/icons';
import { useDeleteQuizAttempt, useRecentQuizAttempts } from '../../hooks';
import { getErrorMessage } from '../../api';
import { fontSizes, fontWeights, useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import { formatDateWithTime } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { QuizAttemptWithSet } from '../../types';

type Nav = NativeStackNavigationProp<QuizStackParamList>;

const MODE_DISPLAY: Record<string, string> = {
  mix: 'Mix',
  mc: 'Multiple Choice',
  story_mc: 'Story MC',
  type_answer: 'Type Answer',
  type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks',
  chunks: 'Reorder',
  read: 'Read',
};

export function QuizHubScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation<Nav>();

  const { data: attempts = [], isLoading, isError, error, refetch, isFetching } = useRecentQuizAttempts(20);
  const { mutate: deleteAttempt } = useDeleteQuizAttempt();

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [activeItem, setActiveItem] = useState<QuizAttemptWithSet | null>(null);

  const openSheet = (item: QuizAttemptWithSet) => setActiveItem(item);
  const closeSheet = () => setActiveItem(null);

  const handleDelete = (item: QuizAttemptWithSet) => {
    closeSheet();
    Alert.alert('Delete Quiz', 'Remove this attempt from your history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAttempt(item.id) },
    ]);
  };

  const handleDetails = (item: QuizAttemptWithSet) => {
    closeSheet();
    navigation.navigate('QuizDetail', {
      id: item.id,
      setIds: item.setIds,
      setTitles: item.setTitles,
      mode: item.mode,
      scorePct: item.scorePct,
      correct: item.correct,
      total: item.total,
      createdAt: item.createdAt,
      practicedAt: item.practicedAt,
      quizName: item.quizName,
      timeSecs: item.timeSecs,
    });
  };

  const renderItem = ({ item }: { item: QuizAttemptWithSet }) => {
    const scored = item.total > 0;
    const scoreColor = item.scorePct >= 80 ? colors.success : item.scorePct >= 50 ? colors.warning : colors.alert;

    return (
      <Pressable
        style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, pressed && styles.rowPressed]}
        onPress={() => handleDetails(item)}
        accessibilityRole="button"
      >
        <View style={[styles.scoreCircle, { borderColor: scored ? scoreColor : colors.border }]}>
          {scored
            ? <Typography style={[styles.scoreText, { color: scoreColor }]}>{item.scorePct}%</Typography>
            : <Typography preset="caption" color={colors.textSecondary}>—</Typography>
          }
        </View>

        <View style={styles.rowText}>
          <Typography preset="h4" color={colors.textPrimary} numberOfLines={1}>
            {item.quizName ?? (item.setIds.length > 1 ? `${item.setIds.length} Sets` : item.setTitle)}
          </Typography>
          {!!item.quizName && (
            <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>
              {item.setIds.length > 1 ? `${item.setIds.length} Sets` : item.setTitle}
            </Typography>
          )}
          <Typography preset="caption" color={colors.textSecondary}>
            {MODE_DISPLAY[item.mode ?? 'mix'] ?? item.mode} · {formatDateWithTime(item.practicedAt ?? item.createdAt)}
          </Typography>
        </View>

        {scored && item.scorePct >= 80 && <CheckCircleIcon size={18} color={colors.success} />}

        <Pressable
          hitSlop={12}
          onPress={e => { e.stopPropagation(); openSheet(item); }}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreVerticalIcon size={20} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    );
  };

  const footer = !isLoading && !isError ? (
    <View style={[styles.footerBar, { borderTopColor: colors.border }]}>
      <Button
        label="+ Start New Quiz"
        onPress={() => navigation.navigate('QuizSetup', undefined)}
        fullWidth
      />
    </View>
  ) : undefined;

  return (
    <Screen header={<ScreenHeader title="Quiz" />} footer={footer}>
      {isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>
      ) : attempts.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            title="No quizzes yet"
            subtitle="Tap 'Start New Quiz' below to test yourself"
          />
        </View>
      ) : (
        <View style={styles.flex}>
        <FlatList
          data={attempts}
          keyExtractor={a => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.accent} />}
          style={styles.flex}
          ListHeaderComponent={
            <Typography preset="caption" color={colors.textSecondary} style={styles.listHeader}>
              RECENT ACTIVITY
            </Typography>
          }
        />
        </View>
      )}

      <ActionSheet
        visible={!!activeItem}
        title={activeItem?.quizName ?? activeItem?.setTitle}
        onClose={closeSheet}
        actions={[
          {
            label: 'Details',
            icon: EyeIcon,
            onPress: () => activeItem && handleDetails(activeItem),
          },
          ...(activeItem?.responses && (activeItem.responses as any[]).length > 0 ? [{
            label: 'Summary',
            icon: ListIcon,
            onPress: () => {
              closeSheet();
              (navigation as any).navigate('QuizSummary', {
                items: activeItem!.responses,
                title: activeItem!.quizName ?? activeItem!.setTitle,
                scorePct: activeItem!.scorePct,
                total: activeItem!.total,
                correct: activeItem!.correct,
              });
            },
          }] : []),
          {
            label: 'Re-Quiz',
            icon: RefreshIcon,
            onPress: () => activeItem && navigation.navigate('Quiz', {
              setIds: activeItem.setIds,
              setTitles: activeItem.setTitles,
              mode: (activeItem.mode ?? 'mix') as any,
              retakeAttemptId: activeItem.id,
            }),
          },
          {
            label: 'Delete',
            icon: TrashIcon,
            destructive: true,
            onPress: () => activeItem && handleDelete(activeItem),
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: layout.screenPaddingH, gap: spacing.sm, flexGrow: 1 },
  listHeader: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadiusSm,
    borderWidth: 1,
  },
  scoreCircle: {
    width: layout.iconCircleLg,
    height: layout.iconCircleLg,
    borderRadius: layout.iconCircleLg / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: spacing.s2 },
  footerBar: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
});
