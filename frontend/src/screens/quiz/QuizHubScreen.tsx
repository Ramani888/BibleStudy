import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ActionSheet, EmptyState, ErrorState, Skeleton } from '../../components/feedback';
import { Button, Screen, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, EyeIcon, MoreVerticalIcon, RefreshIcon, TrashIcon } from '../../components/icons';
import { useDeleteQuizAttempt, useRecentQuizAttempts } from '../../hooks';
import { getErrorMessage } from '../../api';
import { type Theme, useTheme } from '../../theme';
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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const navigation = useNavigation<Nav>();

  const { data: attempts = [], isLoading, isError, error, refetch, isFetching } = useRecentQuizAttempts(20);
  const { mutate: deleteAttempt } = useDeleteQuizAttempt();

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
    });
  };

  const renderItem = ({ item }: { item: QuizAttemptWithSet }) => {
    const scored = item.total > 0;
    const scoreColor = item.scorePct >= 80 ? colors.success : item.scorePct >= 50 ? colors.warning : colors.error;

    return (
      <Pressable
        style={styles.row}
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
    <View style={styles.footerBar}>
      <Button
        label="+ Start New Quiz"
        onPress={() => navigation.navigate('QuizSetup', undefined)}
        fullWidth
      />
    </View>
  ) : undefined;

  return (
    <Screen header={<ScreenHeader title="Quiz" />} footer={footer}>
      {isLoading ? (
        <View style={styles.pad}>
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={72} borderRadius={12} style={styles.skeletonRow} />)}
        </View>
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : attempts.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          subtitle="Tap 'Start New Quiz' below to test yourself"
        />
      ) : (
        <FlatList
          data={attempts}
          keyExtractor={a => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isLoading}
          onRefresh={refetch}
          style={styles.flex}
          ListHeaderComponent={
            <Typography preset="caption" color={colors.textSecondary} style={styles.listHeader}>
              RECENT ACTIVITY
            </Typography>
          }
        />
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pad: { padding: layout.screenPaddingH, gap: spacing[3] },
    list: { padding: layout.screenPaddingH, gap: spacing[2], flexGrow: 1 },
    listHeader: { marginBottom: spacing[3] },
    skeletonRow: { marginBottom: spacing[2] },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundCard,
    },
    scoreCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreText: {
      fontSize: 13,
      fontWeight: '700' as const,
    },
    rowText: { flex: 1, gap: spacing[0.5] },
    footerBar: {
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
