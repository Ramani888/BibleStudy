import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useIsFocused, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../../components/ui';
import { BackIcon } from '../../components/icons';
import { useCardsForSets, useConfirmDialog } from '../../hooks';
import { ConfirmDialog } from '../../components/feedback';
import { buildSummaryItems, useQuizSession } from '../../hooks/useQuizSession';
import { layout, spacing, useTheme } from '../../theme';
import { QuizItemView, QuizResultScreen } from './components';
import type { QuizSelectableMode } from '../../types';

type Params = { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode; quizName?: string; retakeAttemptId?: string };

function formatTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function QuizScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<{ Quiz: Params }, 'Quiz'>>();
  const { setIds, setTitles, mode = 'mix', quizName, retakeAttemptId } = params;

  const isFocused = useIsFocused();
  const { data: cards = [], isLoading, isError } = useCardsForSets(setIds);
  const s = useQuizSession(cards, mode);
  const [responses, setResponses] = useState<Record<number, unknown>>({});
  const saveResponse = (idx: number, r: unknown) => setResponses(prev => ({ ...prev, [idx]: r }));
  const goBack = () => navigation.goBack();
  const { show, dialogProps } = useConfirmDialog();
  const showRef = useRef(show);
  showRef.current = show;

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quizStarted = useRef(false);

  // Fix 4: only start timer once quiz is actually ready
  useEffect(() => {
    if (isLoading || isError || !s.isAvailable || quizStarted.current) return;
    quizStarted.current = true;
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoading, isError, s.isAvailable]);

  // Fix 8: only register BackHandler during an active quiz (not loading/error/complete)
  useEffect(() => {
    if (isLoading || isError || !s.isAvailable || s.isComplete) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      showRef.current({
        title: 'Quit quiz?',
        message: 'Your progress will be lost.',
        confirmLabel: 'Quit',
        variant: 'danger',
        onConfirm: goBack,
      });
      return true;
    });
    return () => handler.remove();
  }, [isLoading, isError, s.isAvailable, s.isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    s.next();
  };

  const headerTitle = quizName ?? (setTitles.length === 1 ? setTitles[0] : `${setTitles.length} Sets`);

  // Fix 1: back button on error/loading/unavailable states (gesture is disabled globally)
  const safeHeader = (
    <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
      <Pressable
        style={({ pressed }) => pressed && styles.backPressed}
        onPress={goBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <BackIcon size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );

  if (isError) return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {safeHeader}
      <View style={styles.center}><Typography preset="h4" align="center">Failed to load cards</Typography></View>
    </View>
  );

  if (isLoading) return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {safeHeader}
      <View style={styles.center}><Typography preset="body" color={colors.textSecondary}>Loading…</Typography></View>
    </View>
  );

  if (!s.isAvailable) return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {safeHeader}
      <View style={styles.center}><Typography preset="h4" align="center">Nothing to quiz here</Typography></View>
    </View>
  );

  // Fix 2: StatusBar hidden on result screen too
  if (s.isComplete) {
    const summaryItems = buildSummaryItems(s.items, responses);
    return (
      <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <StatusBar hidden />
        <QuizResultScreen
          setIds={setIds} setTitle={headerTitle} mode={mode} quizName={quizName}
          total={s.scoredTotal} correct={s.correctCount} scorePct={s.scorePct}
          timeSecs={elapsed}
          summaryItems={summaryItems}
          retakeAttemptId={retakeAttemptId}
          isFocused={isFocused}
          onExit={goBack}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.timerWrap}>
          <Typography preset="label" color={colors.textSecondary} style={styles.timer}>
            {formatTime(elapsed)}
          </Typography>
        </View>
        <Typography preset="label" color={colors.textPrimary} numberOfLines={1} style={styles.title}>
          {headerTitle}
        </Typography>
        <View style={styles.counterWrap}>
          <Typography preset="label" color={colors.textSecondary}>{s.index + 1}/{s.total}</Typography>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.progressFill, { width: `${Math.round(s.progress * 100)}%` as any, backgroundColor: colors.accent }]} />
      </View>

      {s.item && (
        <QuizItemView
          key={s.index}
          item={s.item}
          initialResponse={responses[s.index]}
          onResponseChange={r => saveResponse(s.index, r)}
          hasPrev={s.index > 0}
          isLast={s.index + 1 >= s.total}
          onPrev={s.prev}
          onNext={s.next}
          onFinish={finish}
          bottomInset={insets.bottom}
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill:          { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
  safeHeader:    { paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md },
  timerWrap:     { width: 56, alignItems: 'flex-start' }, // ponytail: off-grid, no spacing.s56
  timer:         { fontVariant: ['tabular-nums'] },
  title:         { flex: 1, textAlign: 'center' },
  counterWrap:   { width: 56, alignItems: 'flex-end' }, // ponytail: off-grid, no spacing.s56
  backPressed:   { opacity: 0.85 },
  progressTrack: { height: layout.progressBarHeight, width: '100%' },
  progressFill:  { height: layout.progressBarHeight },
});
