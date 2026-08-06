import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../../components/ui';
import { useCardsForSets, useUpdateQuizAttempt } from '../../hooks';
import { useQuizSession } from '../../hooks/useQuizSession';
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

  const { data: cards = [], isLoading, isError } = useCardsForSets(setIds);
  const s = useQuizSession(cards, mode);
  const { mutate: updateAttempt } = useUpdateQuizAttempt();
  const [responses, setResponses] = useState<Record<number, unknown>>({});
  const saveResponse = (idx: number, r: unknown) => setResponses(prev => ({ ...prev, [idx]: r }));
  const goBack = () => (navigation as any).popToTop();

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const finish = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (retakeAttemptId) {
      updateAttempt({ attemptId: retakeAttemptId, payload: { setIds, total: 0, correct: 0, mode, quizName } });
    }
    s.next(); // marks isComplete → renders result screen
  };

  const headerTitle = quizName ?? (setTitles.length === 1 ? setTitles[0] : `${setTitles.length} Sets`);

  if (isError) return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.center}><Typography preset="h4" align="center">Failed to load cards</Typography></View>
    </View>
  );

  if (isLoading) return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.center}><Typography preset="body" color={colors.textSecondary}>Loading…</Typography></View>
    </View>
  );

  if (!s.isAvailable) return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.center}><Typography preset="h4" align="center">Nothing to quiz here</Typography></View>
    </View>
  );

  if (s.isComplete) return (
    <View style={[styles.fill, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <QuizResultScreen
        setIds={setIds} setTitle={headerTitle} mode={mode} quizName={quizName}
        total={0} correct={0} scorePct={0}
        retakeAttemptId={retakeAttemptId}
        onRetake={s.restart} onExit={goBack}
      />
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {/* Header: timer | title | counter */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
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

      <View style={[styles.progressTrack, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={[styles.progressFill, { width: `${Math.round(s.progress * 100)}%` as any, backgroundColor: colors.primary }]} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  fill:          { flex: 1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[3] },
  timerWrap:     { width: 56, alignItems: 'flex-start' },
  timer:         { fontVariant: ['tabular-nums'] },
  title:         { flex: 1, textAlign: 'center' },
  counterWrap:   { width: 56, alignItems: 'flex-end' },
  progressTrack: { height: 4, width: '100%' },
  progressFill:  { height: 4 },
});
