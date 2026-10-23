import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StatusBar, StyleSheet, View } from 'react-native'; // StatusBar used imperatively via useFocusEffect
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Typography } from '../../components/ui';
import { QMConfirmDialog, QMEmpty } from '../../components/qm';
import { CardsIcon, CloseIcon, InfoIcon } from '../../components/icons';
import { useCardsForSets, useConfirmDialog } from '../../hooks';
import { buildSummaryItems, useQuizSession } from '../../hooks/useQuizSession';
import { spacing, useTheme } from '../../theme';
import { QuizItemView, QuizResultScreen } from './components';
import type { Card, QuizSelectableMode } from '../../types';
import type { GeneratedQuizCard } from '../../navigation/types';

type Params = { setIds: string[]; setTitles: string[]; mode?: QuizSelectableMode; quizName?: string; topic?: string; retakeAttemptId?: string; generatedCards?: GeneratedQuizCard[]; reviewCards?: Card[]; ephemeral?: boolean };

/** Wrap an LLM-generated {question,answer} as an in-memory QA Card (never persisted). */
function toEphemeralCard(c: GeneratedQuizCard, i: number): Card {
  return {
    id: `gen-${i}`, setId: 'generated', userId: null, type: 'QA',
    question: c.question, answer: c.answer, note: null, imageId: null,
    order: i, isBlurred: false, difficulty: 'MEDIUM', lastStudiedAt: null, nextReviewAt: null,
    createdAt: '', updatedAt: '',
  };
}


import { useTranslation } from 'react-i18next';

export function QuizScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<{ Quiz: Params }, 'Quiz'>>();
  const { setIds, setTitles, mode = 'mix', quizName, topic, retakeAttemptId, generatedCards, reviewCards, ephemeral = false } = params;

  useFocusEffect(useCallback(() => {
    StatusBar.setHidden(true, 'fade');
    return () => {
      // "Practice missed" pushes another Quiz: its focus runs before this blur
      // cleanup, so un-hiding here would bring the status bar back mid-quiz.
      const state = navigation.getState();
      if (state?.routes[state.index]?.name !== 'Quiz') StatusBar.setHidden(false, 'fade');
    };
  }, [navigation]));

  // Two "cards passed via params" cases (both skip the per-set fetch):
  //  • generatedCards → AI quiz (real card ids absent → SM-2 not fed, but the
  //    attempt IS recorded set-less unless `ephemeral` is set, e.g. practice-missed)
  //  • reviewCards    → real due cards (real ids → recorded + feeds SM-2)
  const isGenerated = !!generatedCards && generatedCards.length > 0;
  const isReview = !!reviewCards && reviewCards.length > 0;
  if (__DEV__ && isGenerated && isReview) {
    console.warn('QuizScreen: generatedCards + reviewCards both passed — using generatedCards (ephemeral). Callers should pass exactly one.');
  }
  const usePassed = isGenerated || isReview;
  const fetched = useCardsForSets(usePassed ? [] : setIds);
  // Memoise so the reference is stable across renders — otherwise the 1s elapsed
  // timer re-renders → new array → useQuizSession rebuilds+reshuffles every second.
  const cards = useMemo(
    () => (isGenerated ? generatedCards!.map(toEphemeralCard) : isReview ? reviewCards! : fetched.data),
    [isGenerated, isReview, generatedCards, reviewCards, fetched.data],
  );
  const isLoading = usePassed ? false : fetched.isLoading;
  const isError = usePassed ? false : fetched.isError;
  const s = useQuizSession(cards, mode);
  const [responses, setResponses] = useState<Record<number, unknown>>({});
  const saveResponse = useCallback((idx: number, r: unknown) => setResponses(prev => ({ ...prev, [idx]: r })), []);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const { show, dialogProps } = useConfirmDialog();
  const showRef = useRef(show);
  showRef.current = show;
  const askQuitRef = useRef<() => void>(() => {});

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
    const handler = BackHandler.addEventListener('hardwareBackPress', () => { askQuitRef.current(); return true; });
    return () => handler.remove();
  }, [isLoading, isError, s.isAvailable, s.isComplete, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    s.next();
  }, [s]);

  const headerTitle = quizName ?? (setTitles.length === 1 ? setTitles[0] : t('quiz:hub.setsCount', { count: setTitles.length }));
  const askQuit = useCallback(() => showRef.current({
    title: t('quiz:qm.leaveTitle', 'Leave this quiz?'),
    message: t('quiz:qm.leaveText', 'Your answers in this round won’t be saved.'),
    confirmLabel: t('quiz:qm.leave', 'Leave'),
    cancelLabel: t('quiz:qm.keepGoing', 'Keep going'),
    onConfirm: goBack,
  }), [goBack, t]);
  askQuitRef.current = askQuit;

  // Back button on error/loading/unavailable states (gesture is disabled globally)
  const closeBtn = (onPress: () => void) => (
    <Pressable
      style={({ pressed }) => [styles.close, { backgroundColor: qm.field }, pressed && styles.dim]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('quiz:qm.leaveA11y', 'Leave quiz')}
    >
      <CloseIcon size={18} color={qm.ink} strokeWidth={2} />
    </Pressable>
  );
  const bare = (body: React.ReactNode) => (
    <View style={[styles.fill, { backgroundColor: qm.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>{closeBtn(goBack)}</View>
      {body}
    </View>
  );

  if (isError) return bare(
    <QMEmpty
      style={styles.msg}
      icon={InfoIcon}
      title={t('quiz:qm.loadQuizFailed', 'Couldn’t load this quiz')}
      text={t('quiz:qm.loadFailedText', 'Check your connection and try again.')}
      action={{ label: t('quiz:qm.tryAgain', 'Try again'), onPress: () => { fetched.refetch(); } }}
    />,
  );

  if (isLoading) return bare(<ActivityIndicator color={qm.violet} style={styles.msg} />);

  if (!s.isAvailable) return bare(
    <QMEmpty
      style={styles.msg}
      icon={CardsIcon}
      title={t('quiz:inQuiz.emptyState', 'Nothing to quiz here')}
      text={t('quiz:qm.emptyText2', 'This set has no cards yet. Add a few cards, then come back.')}
      action={{ label: t('common:actions.goBack', 'Go back'), onPress: goBack }}
    />,
  );

  if (s.isComplete) {
    const summaryItems = buildSummaryItems(s.items, responses);
    return (
      <View style={[styles.fill, { backgroundColor: qm.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <QuizResultScreen
          setIds={setIds} setTitle={headerTitle} mode={mode} quizName={quizName} topic={topic}
          total={s.scoredTotal} correct={s.correctCount} scorePct={s.scorePct}
          timeSecs={elapsed}
          summaryItems={summaryItems}
          retakeAttemptId={retakeAttemptId}
          ephemeral={ephemeral}
          onExit={goBack}
        />
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: qm.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {closeBtn(askQuit)}
        <ProgressBar progress={s.progress} step={s.index} total={s.total} />
        <Typography preset="qmButton" color={qm.muted} style={styles.counter}>
          {t('quiz:qm.stepOf', { step: s.index + 1, total: s.total, defaultValue: `${s.index + 1} of ${s.total}` })}
        </Typography>
      </View>

      {s.item && (
        <QuizItemView
          key={s.index}
          item={s.item}
          initialResponse={responses[s.index]}
          onResponseChange={r => saveResponse(s.index, r)}
          onSubmit={s.submit}
          submitted={s.submitted}
          lastCorrect={s.lastCorrect}
          correctAnswer={s.correctAnswer}
          isLast={s.index + 1 >= s.total}
          onNext={s.next}
          onFinish={finish}
          bottomInset={insets.bottom}
          setName={headerTitle}
          ephemeral={ephemeral}
          comesBack={!isGenerated && !ephemeral}
        />
      )}
      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function ProgressBar({ progress, step, total }: { progress: number; step: number; total: number }) {
  const { qm } = useTheme();
  const [w, setW] = useState(0);
  const anim = useAnimatedStyle(() => ({ width: withTiming(w * progress, { duration: 300 }) }), [w, progress]);
  return (
    <View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: qm.lilac }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      <Animated.View style={[styles.bar, { backgroundColor: qm.violet }, anim]} />
    </View>
  );
}

const TOUCH = 44;
const TRACK_H = 8;
const COUNTER_MIN_W = 52;

const styles = StyleSheet.create({
  fill:    { flex: 1 },
  dim:     { opacity: 0.6 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, paddingLeft: spacing.md, paddingRight: spacing.lg },
  close:   { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  track:   { flex: 1, height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden' },
  bar:     { height: TRACK_H, borderRadius: TRACK_H / 2 },
  counter: { minWidth: COUNTER_MIN_W, textAlign: 'right' },
  msg:     { marginTop: spacing.s80 + spacing.s48 },
});
