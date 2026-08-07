import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Typography } from '../../../components/ui';
import { StarIcon, StarOutlineIcon } from '../../../components/icons';
import { useQuizAttemptSave } from '../../../hooks';
import { layout, spacing, useTheme } from '../../../theme';

const RESULT_ICON_SIZE = 56;
const AUTO_EXIT_SECS = 5;

interface Props {
  setIds: string[];
  setTitle: string;
  mode?: string;
  quizName?: string;
  total: number;
  correct: number;
  scorePct: number;
  timeSecs?: number;
  retakeAttemptId?: string;
  onExit: () => void;
}

export function QuizResultScreen({
  setIds, setTitle, mode, quizName,
  total, correct, scorePct, timeSecs,
  retakeAttemptId, onExit,
}: Props) {
  const { colors } = useTheme();
  const { save, isPending, isError, error } = useQuizAttemptSave(retakeAttemptId);
  const saved = useRef(false);
  const [best, setBest] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(AUTO_EXIT_SECS);

  // Save once on mount — unified hook handles create vs update
  useEffect(() => {
    if (saved.current || total === 0) return;
    saved.current = true;
    const payload = { setIds, total, correct, mode, quizName, timeSecs };
    console.log('[QuizResult] saving payload:', JSON.stringify(payload));
    save(payload)
      .then(res => {
        console.log('[QuizResult] save success:', JSON.stringify(res));
        setBest(res.best ?? null);
      })
      .catch(err => {
        console.error('[QuizResult] save failed:', err?.message ?? err);
        console.error('[QuizResult] response body:', JSON.stringify(err?.response?.data));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-exit countdown — pauses while save is in flight so we don't
  // navigate away before the invalidation completes
  useEffect(() => {
    if (isPending) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); onExit(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPending, onExit]);

  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.error;
  const isNewBest = best !== null && scorePct >= best;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.wrap}>
      <StarIcon size={RESULT_ICON_SIZE} color={colors.warning} />
      <Typography preset="h2" align="center">Quiz Complete!</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.sub}>
        {setTitle}
      </Typography>

      <View style={styles.scoreWrap}>
        <Typography style={[styles.scoreNumber, { color: scoreColor }]}>{scorePct}%</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {correct} / {total} correct
        </Typography>
      </View>

      {best !== null && (
        <View style={[styles.pill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          {isNewBest
            ? <StarIcon size={16} color={colors.warning} />
            : <StarOutlineIcon size={16} color={colors.textSecondary} />
          }
          <Typography preset="caption" color={isNewBest ? colors.warning : colors.textSecondary}>
            {isNewBest ? 'New best!' : `Best: ${best}%`}
          </Typography>
        </View>
      )}

      {isError && (
        <View style={[styles.pill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.error }]}>
          <Typography preset="caption" color={colors.error}>
            Save failed: {(error as any)?.message ?? 'Unknown error'}
          </Typography>
        </View>
      )}

      <Button
        label={isPending ? 'Saving…' : `Done (${countdown})`}
        onPress={onExit}
        disabled={isPending}
        fullWidth
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPaddingH,
    gap: spacing[4],
  },
  sub: { marginTop: -spacing[2] },
  scoreWrap: { alignItems: 'center', gap: spacing[0.5] },
  scoreNumber: { fontSize: 52, fontWeight: '700' as const, lineHeight: 64 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 999,
    borderWidth: 1,
  },
});
