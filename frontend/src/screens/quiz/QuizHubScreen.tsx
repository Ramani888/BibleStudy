import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ActionSheet, ConfirmDialog, EmptyState, ErrorState } from '../../components/feedback';
import { Button, Screen, SearchBar, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ChevronRightIcon, EyeIcon, ListIcon, MoreVerticalIcon, RefreshIcon, SearchIcon, TrashIcon } from '../../components/icons';
import { useConfirmDialog, useDeleteQuizAttempt, useDueCards, useDueSummary, useRecentQuizAttempts, useSearchToggle } from '../../hooks';

import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../api';
import { fontSizes, fontWeights, useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import { formatDateWithTime } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { QuizAttemptWithSet } from '../../types';
import { MODE_NAMES, reQuizParams, scoreColor } from './quizUi';

const ICON_SIZE = 20;

type Nav = NativeStackNavigationProp<QuizStackParamList>;

export function QuizHubScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation<Nav>();

  const { data: attempts = [], isLoading, isError, error, refetch } = useRecentQuizAttempts(20);
  const { data: dueSummary } = useDueSummary();
  const due = useDueCards();
  const dueCount = dueSummary?.dueCount ?? 0;
  const { mutate: deleteAttempt } = useDeleteQuizAttempt();

  // Review due cards → a real, tracked SR session (records + updates SM-2).
  const handleReviewDue = useCallback(async () => {
    if (due.isFetching) return; // guard double-tap → avoid two refetches + double navigate
    const res = await due.refetch();
    const cards = res.data ?? [];
    if (cards.length === 0) return;
    const setIds = [...new Set(cards.map(c => c.setId))];
    const title = t('quiz:hub.reviewDue', 'Review due cards');
    navigation.navigate('Quiz', { setIds, setTitles: [title], reviewCards: cards, mode: 'mix', quizName: title });
  }, [due, navigation, t]);
  const { show, dialogProps } = useConfirmDialog();
  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();

  const filteredAttempts = useMemo(() => {
    if (!search.trim()) return attempts;
    const q = search.trim().toLowerCase();
    return attempts.filter(a =>
      (a.quizName ?? '').toLowerCase().includes(q) ||
      (a.setTitle ?? '').toLowerCase().includes(q),
    );
  }, [attempts, search]);

  // Silent background refresh on focus — does NOT trigger the pull-to-refresh spinner
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }, [refetch]);

  const [activeItem, setActiveItem] = useState<QuizAttemptWithSet | null>(null);

  const openSheet = useCallback((item: QuizAttemptWithSet) => setActiveItem(item), []);
  const closeSheet = useCallback(() => setActiveItem(null), []);

  const handleDelete = useCallback((item: QuizAttemptWithSet) => {
    closeSheet();
    show({
      title: t('common:dialogs.deleteConfirmTitle'),
      message: t('quiz:detail.deleteMessage', 'Remove this attempt from your history?'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: () => deleteAttempt(item.id),
    });
  }, [closeSheet, show, deleteAttempt, t]);

  const handleDetails = useCallback((item: QuizAttemptWithSet) => {
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
      topic: item.topic,
      timeSecs: item.timeSecs,
    });
  }, [closeSheet, navigation]);

  const renderItem = useCallback(({ item }: { item: QuizAttemptWithSet }) => {
    const scored = item.total > 0;
    const scoreCol = scoreColor(item.scorePct, colors);
    // Where the quiz came from — a topic, some sets, or an AI quiz with neither.
    const sourceLabel = item.topic
      ? t('quiz:hub.fromTopic', { topic: item.topic, defaultValue: `Topic · ${item.topic}` })
      : item.setIds.length > 1
        ? t('quiz:hub.setsCount', { count: item.setIds.length })
        : item.setTitle || t('quiz:hub.aiQuiz', 'AI quiz');

    return (
      <Pressable
        style={({ pressed }) => [styles.row, { borderColor: colors.cardBorder, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, pressed && styles.rowPressed]}
        onPress={() => handleDetails(item)}
        accessibilityRole="button"
      >
        <View style={[styles.scoreCircle, { borderColor: scored ? scoreCol : colors.border }]}>
          {scored
            ? <Typography style={[styles.scoreText, { color: scoreCol }]}>{item.scorePct}%</Typography>
            : <Typography preset="caption" color={colors.textSecondary}>—</Typography>
          }
        </View>

        <View style={styles.rowText}>
          <Typography preset="h4" color={colors.textPrimary} numberOfLines={1}>
            {item.quizName ?? sourceLabel}
          </Typography>
          {!!item.quizName && item.quizName !== sourceLabel && (
            <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>
              {sourceLabel}
            </Typography>
          )}
          <Typography preset="caption" color={colors.textSecondary}>
            {t(`quiz:modeNames.${item.mode ?? 'mix'}`, MODE_NAMES[item.mode ?? 'mix'] ?? item.mode)} · {formatDateWithTime(item.practicedAt ?? item.createdAt)}
          </Typography>
        </View>

        {scored && item.scorePct >= 80 && <CheckCircleIcon size={18} color={colors.success} />}

        <Pressable
          hitSlop={12}
          onPress={e => { e.stopPropagation(); openSheet(item); }}
          style={({ pressed }) => pressed && styles.iconPressed}
          accessibilityRole="button"
          accessibilityLabel={t('common:actions.moreOptions', 'More options')}
        >
          <MoreVerticalIcon size={20} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    );
  }, [handleDetails, openSheet, colors, isDark, t]);

  const footer = !isLoading && !isError ? (
    <View style={[styles.footerBar, { borderTopColor: colors.divider }]}>
      <Button
        label={t('quiz:hub.startNewQuiz', '+ Start New Quiz')}
        onPress={() => navigation.navigate('QuizSetup', undefined)}
        fullWidth
      />
    </View>
  ) : undefined;

  return (
    <Screen
      header={
        <ScreenHeader
          title={t('navigation:tabs.study', 'Quiz')}
          right={
            <Pressable onPress={toggleSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.accent : colors.textSecondary} />
            </Pressable>
          }
        />
      }
      footer={footer}
    >
      {searchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder={t('quiz:hub.searchPlaceholder', 'Search quizzes…')} autoFocus />
        </View>
      )}

      {dueCount > 0 && (
        <Pressable
          onPress={handleReviewDue}
          disabled={due.isFetching}
          style={({ pressed }) => [styles.dueBanner, { backgroundColor: colors.accent }, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <RefreshIcon size={ICON_SIZE} color={colors.textOnAccent} />
          <View style={styles.flex}>
            <Typography preset="h4" color={colors.textOnAccent}>{t('quiz:hub.reviewDue', 'Review due cards')}</Typography>
            <Typography preset="caption" color={colors.textOnPrimaryMuted}>
              {t('quiz:hub.dueCount', { count: dueCount, defaultValue: `${dueCount} cards due for review` })}
            </Typography>
          </View>
          {due.isFetching
            ? <ActivityIndicator color={colors.textOnAccent} />
            : <ChevronRightIcon size={ICON_SIZE} color={colors.textOnAccent} />}
        </Pressable>
      )}

      {isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>
      ) : filteredAttempts.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            title={search ? t('common:status.noResults', 'No results') : t('quiz:hub.emptyTitle', 'No quizzes yet')}
            subtitle={search ? t('common:status.noMatchFor', { query: search, defaultValue: `No quizzes match "${search}"` }) : t('quiz:hub.emptySub', "Tap 'Start New Quiz' to generate one with AI")}
          />
        </View>
      ) : (
        <View style={styles.flex}>
        <FlatList
          data={filteredAttempts}
          keyExtractor={a => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
          style={styles.flex}
          ListHeaderComponent={
            <Typography preset="caption" color={colors.textSecondary} style={styles.listHeader}>
              {t('home:sections.recentActivity', 'RECENT ACTIVITY')}
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
            label: t('quiz:hub.details', 'Details'),
            icon: EyeIcon,
            onPress: () => activeItem && handleDetails(activeItem),
          },
          ...(activeItem?.responses && (activeItem.responses as any[]).length > 0 ? [{
            label: t('quiz:summary.title', 'Summary'),
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
            label: t('quiz:summary.reQuiz', 'Re-Quiz'),
            icon: RefreshIcon,
            onPress: () => activeItem && navigation.navigate('Quiz', reQuizParams(activeItem, activeItem.responses)),
          },
          {
            label: t('common:actions.delete', 'Delete'),
            icon: TrashIcon,
            destructive: true,
            onPress: () => activeItem && handleDelete(activeItem),
          },
        ]}
      />
      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: spacing.md,
    borderRadius: layout.cardRadiusSm,
  },
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
  iconPressed: { opacity: 0.85 },
  rowText: { flex: 1, gap: spacing.s2 },
  footerBar: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
});
