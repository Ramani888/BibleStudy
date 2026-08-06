import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Typography } from '../../../components/ui';
import { StarIcon, StarOutlineIcon } from '../../../components/icons';
import { useRecordQuizAttempt } from '../../../hooks';
import { layout, spacing, useTheme } from '../../../theme';

const RESULT_ICON_SIZE = 56;

interface Props {
  setId: string;
  setTitle: string;
  mode?: string;
  total: number;
  correct: number;
  scorePct: number;
  onRetake: () => void;
  onExit: () => void;
}

export function QuizResultScreen({ setId, setTitle, mode, total, correct, scorePct, onRetake, onExit }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { mutate: recordAttempt } = useRecordQuizAttempt();
  const recorded = useRef(false);
  const [best, setBest] = useState<number | null>(null);

  // Persist the attempt once on mount — only if something was scored
  // (a Read-only quiz has total 0 and isn't recorded).
  useEffect(() => {
    if (recorded.current || total === 0) return;
    recorded.current = true;
    recordAttempt(
      { setId, total, correct, mode },
      { onSuccess: res => setBest(res.best) },
    );
  }, [recordAttempt, setId, total, correct, mode]);

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
        <View style={styles.bestPill}>
          {isNewBest
            ? <StarIcon size={16} color={colors.warning} />
            : <StarOutlineIcon size={16} color={colors.textSecondary} />
          }
          <Typography preset="caption" color={isNewBest ? colors.warning : colors.textSecondary}>
            {isNewBest ? 'New best!' : `Best: ${best}%`}
          </Typography>
        </View>
      )}

      <View style={styles.btns}>
        <Button label="Retake" onPress={onRetake} variant="secondary" style={styles.flex} />
        <Button label="Done" onPress={onExit} style={styles.flex} />
      </View>
    </Animated.View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
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
    bestPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: 999,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btns: { flexDirection: 'row', gap: spacing[3], alignSelf: 'stretch' },
    flex: { flex: 1 },
  });
}
