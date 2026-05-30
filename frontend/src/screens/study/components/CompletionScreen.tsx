import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Typography } from '../../../components/ui';
import { colors, spacing, layout } from '../../../theme';
import type { Difficulty } from '../../../types';

const COMPLETION_ICON_SIZE = 56;

interface CompletionScreenProps {
  total: number;
  results: Record<Difficulty, number>;
  skippedCount: number;
  onRestart: () => void;
  onRetryHard?: () => void;
  onExit: () => void;
}

export function CompletionScreen({
  total,
  results,
  skippedCount,
  onRestart,
  onRetryHard,
  onExit,
}: CompletionScreenProps) {
  const rated = results.EASY + results.MEDIUM + results.HARD;
  const score = rated > 0
    ? Math.round((results.EASY + results.MEDIUM * 0.5) / rated * 100)
    : 0;
  const scoreColor = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.wrap}>
      <Icon name="trophy-outline" size={COMPLETION_ICON_SIZE} color={colors.warning} />
      <Typography preset="h2" align="center">Session Complete!</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.sub}>
        You reviewed {total} cards
      </Typography>

      {rated > 0 && (
        <View style={styles.scoreWrap}>
          <Typography style={[styles.scoreNumber, { color: scoreColor }]}>{score}%</Typography>
          <Typography preset="caption" color={colors.textSecondary}>score</Typography>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.successSurface }]}>
          <Typography preset="h3" color={colors.success}>{results.EASY}</Typography>
          <Typography preset="caption" color={colors.success}>Easy</Typography>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.warningSurface }]}>
          <Typography preset="h3" color={colors.warning}>{results.MEDIUM}</Typography>
          <Typography preset="caption" color={colors.warning}>Medium</Typography>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.errorSurface }]}>
          <Typography preset="h3" color={colors.error}>{results.HARD}</Typography>
          <Typography preset="caption" color={colors.error}>Hard</Typography>
        </View>
        {skippedCount > 0 && (
          <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Typography preset="h3" color={colors.textSecondary}>{skippedCount}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Skipped</Typography>
          </View>
        )}
      </View>

      {results.HARD > 0 && onRetryHard && (
        <Button label={`Retry Hard (${results.HARD})`} variant="outline" onPress={onRetryHard} fullWidth />
      )}
      <View style={styles.btns}>
        <Button label="Study Again" onPress={onRestart} variant="secondary" style={styles.flex} />
        <Button label="Done" onPress={onExit} style={styles.flex} />
      </View>
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
  statsGrid: { flexDirection: 'row', gap: spacing[3], marginVertical: spacing[2] },
  statBox: { flex: 1, borderRadius: 12, padding: spacing[4], alignItems: 'center', gap: spacing[1] },
  btns: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  flex: { flex: 1 },
});
