import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMButton, QMConfirmDialog, QMEmpty, QMSearchField, QMSheet, qmRowEnter, type QMSheetAction } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  ChevronRightIcon, InfoIcon, LeafIcon, ListIcon, MoreVerticalIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon,
} from '../../components/icons';
import {
  useConfirmDialog, useDeleteQuizAttempt, useDueCards, useDueSummary, useManualRefresh, useReQuiz, useRecentQuizAttempts, useSearchToggle,
} from '../../hooks';
import { GeneratingQuizModal } from './components';
import { useTheme, spacing, radius } from '../../theme';
import { formatDateWithTime } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { QuizAttemptWithSet } from '../../types';
import { qmModeName, qmScoreTone, reQuizSource } from './quizUi';

const TOUCH = 44;
const SCORE_TILE = 52;

type Nav = NativeStackNavigationProp<QuizStackParamList>;

export function QuizHubScreen() {
  const { t } = useTranslation(['quiz', 'home', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const { data: attempts = [], isLoading, isError, refetch } = useRecentQuizAttempts(20);
  const { data: dueSummary, refetch: refetchDue } = useDueSummary();
  const due = useDueCards();
  const dueCount = dueSummary?.dueCount ?? 0;
  const { mutate: deleteAttempt } = useDeleteQuizAttempt();
  const { reQuiz, dialogProps: reQuizDialog, isGenerating } = useReQuiz();
  const { show, dialogProps } = useConfirmDialog();
  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();
  const { refreshing, onRefresh } = useManualRefresh(() => Promise.all([refetch(), refetchDue()]));
  const [activeItem, setActiveItem] = useState<QuizAttemptWithSet | null>(null);

  // Silent background refresh on focus — does NOT trigger the pull-to-refresh spinner
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

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

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => !q ? attempts : attempts.filter(a =>
    (a.quizName ?? '').toLowerCase().includes(q) || (a.setTitle ?? '').toLowerCase().includes(q),
  ), [attempts, q]);

  // Where the quiz came from — a topic, some sets, or an AI quiz with neither.
  const sourceLabel = useCallback((a: QuizAttemptWithSet) => a.topic
    ? t('quiz:hub.fromTopic', { topic: a.topic })
    : a.setIds.length > 1
      ? t('quiz:qm.setsSource', { count: a.setIds.length, titles: a.setTitles.join(', '), defaultValue: `${a.setIds.length} sets · ${a.setTitles.join(', ')}` })
      : a.setTitle || t('quiz:hub.aiQuiz', 'AI quiz'), [t]);

  const handleDetails = useCallback((item: QuizAttemptWithSet) => {
    navigation.navigate('QuizDetail', {
      id: item.id, setIds: item.setIds, setTitles: item.setTitles, mode: item.mode,
      scorePct: item.scorePct, correct: item.correct, total: item.total,
      createdAt: item.createdAt, practicedAt: item.practicedAt,
      quizName: item.quizName, topic: item.topic, timeSecs: item.timeSecs,
    });
  }, [navigation]);

  const handleDelete = useCallback((item: QuizAttemptWithSet) => {
    show({
      title: t('quiz:qm.deleteTitle', 'Delete this quiz?'),
      message: t('quiz:qm.deleteMessage', 'It will be removed from your history. Your cards and sets stay as they are.'),
      confirmLabel: t('common:actions.delete'),
      cancelLabel: t('quiz:qm.keepIt', 'Keep it'),
      variant: 'danger',
      onConfirm: () => deleteAttempt(item.id),
    });
  }, [show, deleteAttempt, t]);

  const sheetActions = useMemo<QMSheetAction[]>(() => {
    const a = activeItem;
    if (!a) return [];
    const hasAnswers = !!a.responses && a.responses.length > 0;
    return [
      { label: t('quiz:hub.details', 'Details'), icon: InfoIcon, onPress: () => handleDetails(a) },
      ...(hasAnswers ? [{
        label: t('quiz:qm.everyAnswer', 'See every answer'), icon: ListIcon,
        onPress: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- QuizSummary is a root-stack route, outside the Quiz stack
          (navigation as any).navigate('QuizSummary', {
            items: a.responses, title: a.quizName ?? a.setTitle, scorePct: a.scorePct, total: a.total, correct: a.correct,
          });
        },
      }] : []),
      {
        label: t('quiz:qm.quizAgain', 'Quiz me again'), icon: RefreshIcon,
        sub: reQuizSource(a, a.responses) ? t('quiz:qm.costCredits', { count: 2, defaultValue: '2 credits' }) : t('quiz:qm.freeRetake', 'Free to retake'),
        onPress: () => reQuiz(a, a.responses),
      },
      { label: t('quiz:qm.deleteFromHistory', 'Delete from history'), icon: TrashIcon, danger: true, onPress: () => handleDelete(a) },
    ];
  }, [activeItem, handleDetails, handleDelete, reQuiz, navigation, t]);

  const renderItem = useCallback(({ item, index }: { item: QuizAttemptWithSet; index: number }) => {
    const scored = item.total > 0;
    const [tileBg, tileInk] = qmScoreTone(scored ? item.scorePct : null, qm);
    const source = sourceLabel(item);
    const name = item.quizName ?? source;
    return (
      <Animated.View entering={qmRowEnter(index)} style={[styles.row, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        <AnimatedPressable scaleTo={0.98} onPress={() => handleDetails(item)} style={styles.rowMain} accessibilityRole="button" accessibilityLabel={name}>
          <View style={[styles.scoreTile, { backgroundColor: tileBg }]}>
            <Typography preset="qmRowTitle" color={tileInk}>{scored ? `${item.scorePct}%` : '—'}</Typography>
          </View>
          <View style={styles.flex}>
            <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{name}</Typography>
            {name !== source && <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.rowLine}>{source}</Typography>}
            <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.rowLine}>
              {qmModeName(item.mode, t)} · {formatDateWithTime(item.practicedAt ?? item.createdAt)}
            </Typography>
          </View>
        </AnimatedPressable>
        <Pressable
          onPress={() => setActiveItem(item)}
          hitSlop={4}
          style={({ pressed }) => [styles.menu, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('common:actions.moreOptions', 'More options')}
        >
          <MoreVerticalIcon size={20} color={qm.muted} />
        </Pressable>
      </Animated.View>
    );
  }, [qm, sourceLabel, handleDetails, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.s18 }}>
      <View style={styles.titleRow}>
        <Typography preset="qmDisplay" color={qm.ink}>{t('quiz:qm.title', 'Quiz')}</Typography>
        <Pressable
          onPress={toggleSearch}
          style={[styles.searchBtn, searchVisible && { backgroundColor: qm.lilac }]}
          accessibilityRole="button"
          accessibilityLabel={t('quiz:qm.searchA11y', 'Search quizzes')}
          accessibilityState={{ selected: searchVisible }}
        >
          <SearchIcon size={20} color={searchVisible ? qm.link : qm.ink} />
        </Pressable>
      </View>

      {searchVisible && (
        <View style={styles.searchWrap}>
          <QMSearchField value={search} onChangeText={setSearch} placeholder={t('quiz:qm.searchA11y', 'Search quizzes')} autoFocus />
        </View>
      )}

      {dueCount > 0 && !q && (
        <AnimatedPressable
          scaleTo={0.97}
          onPress={handleReviewDue}
          disabled={due.isFetching}
          style={styles.heroWrap}
          accessibilityRole="button"
          accessibilityLabel={`${t('home:today.dueTitle', { count: dueCount })}. ${t('quiz:qm.start', 'Start')}`}
        >
          <LinearGradient
            colors={qm.hero as unknown as string[]}
            locations={[0, 0.55, 1]}
            start={{ x: 0.18, y: 0 }}
            end={{ x: 0.82, y: 1 }}
            style={styles.hero}
          >
            <Typography preset="qmLabel" color={qm.heroMuted}>{t('home:today.dueLabel')}</Typography>
            <Typography preset="qmTitle" color={qm.heroInk} style={styles.heroTitle}>
              {t('quiz:qm.dueTitle', { count: dueCount, defaultValue: `${dueCount} cards are ready to come back to you` })}
            </Typography>
            <View style={styles.heroFoot}>
              <Typography preset="qmBody" color={qm.heroMuted} style={styles.flex}>
                {t('quiz:qm.dueSub', { count: dueSummary?.dueSets ?? 1, defaultValue: 'From your sets · a mix of types' })}
              </Typography>
              <View style={[styles.heroBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}>
                {due.isFetching
                  ? <ActivityIndicator size="small" color={qm.onViolet} />
                  : <Typography preset="qmButton" color={qm.onViolet}>{t('quiz:qm.start', 'Start')}</Typography>}
                <ChevronRightIcon size={16} color={qm.onViolet} strokeWidth={2} />
              </View>
            </View>
          </LinearGradient>
        </AnimatedPressable>
      )}

      {filtered.length > 0 && !isLoading && !isError && (
        <Typography preset="qmSection" color={qm.ink} style={styles.section}>{t('quiz:qm.recent', 'Recent quizzes')}</Typography>
      )}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) {
    empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  } else if (isError) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={InfoIcon}
        title={t('quiz:qm.loadFailedTitle', 'Couldn’t load your quizzes')}
        text={t('quiz:qm.loadFailedText', 'Check your connection and try again.')}
        action={{ label: t('quiz:qm.tryAgain', 'Try again'), onPress: onRefresh }}
      />
    );
  } else if (attempts.length === 0) {
    empty = (
      <View style={styles.firstEmpty}>
        <LeafIcon size={64} color={qm.leaf} strokeWidth={1.3} />
        <Typography preset="qmEmptyTitle" color={qm.ink} align="center" style={styles.firstTitle}>{t('quiz:hub.emptyTitle', 'No quizzes yet')}</Typography>
        <Typography preset="qmBodyMd" color={qm.muted} align="center">
          {t('quiz:qm.emptyText', 'Pick a topic like “the Gospel of John” and Verdance will write a short quiz for you.')}
        </Typography>
      </View>
    );
  } else if (filtered.length === 0) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={SearchIcon}
        title={t('quiz:qm.noMatch', 'No quizzes match')}
        text={t('quiz:qm.noMatchText', { query: search.trim(), defaultValue: `Nothing called “${search.trim()}”. Try a different word.` })}
        action={{ label: t('quiz:qm.clearSearch', 'Clear search'), onPress: () => setSearch('') }}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isLoading || isError ? [] : filtered}
        keyExtractor={a => a.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />

      {!isLoading && !isError && (
        <View style={[styles.footer, { backgroundColor: qm.bg }]}>
          <QMButton icon={PlusIcon} label={t('quiz:qm.startNew', 'Start a new quiz')} onPress={() => navigation.navigate('QuizSetup', undefined)} />
        </View>
      )}

      <QMSheet
        visible={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={activeItem ? activeItem.quizName ?? sourceLabel(activeItem) : undefined}
        actions={sheetActions}
      />
      <QMConfirmDialog {...dialogProps} />
      <QMConfirmDialog {...reQuizDialog} />
      <GeneratingQuizModal visible={isGenerating} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { marginTop: spacing.md },
  heroWrap: { marginTop: spacing.s18 },
  hero: { borderRadius: radius.lg + 2, padding: spacing.xl },
  heroTitle: { marginTop: spacing.s6 },
  heroFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  heroBtn: {
    height: spacing.huge, paddingHorizontal: spacing.lg, borderRadius: radius.pill,
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
  },
  section: { marginTop: spacing.s28, marginBottom: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    paddingVertical: spacing.s14, paddingLeft: spacing.lg, paddingRight: spacing.sm, borderRadius: radius.r20,
  },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s14 },
  scoreTile: { width: SCORE_TILE, height: SCORE_TILE, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowLine: { marginTop: spacing.s2 },
  menu: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  sep: { height: spacing.s10 },
  loading: { marginTop: spacing.s48 },
  emptyGap: { marginTop: spacing.s48 + spacing.s48 },
  firstEmpty: { alignItems: 'center', marginTop: spacing.huge, paddingHorizontal: spacing.lg },
  firstTitle: { marginTop: spacing.s14, marginBottom: spacing.s6 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
});
