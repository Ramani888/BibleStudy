import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button, Typography } from '../../../components/ui';
import { ListIcon, StarIcon, StarOutlineIcon } from '../../../components/icons';
import { useQuizAttemptSave } from '../../../hooks';
import { fontWeights, layout, spacing, useTheme } from '../../../theme';
import type { SummaryItem } from '../../../types';
import type { RootStackParamList } from '../../../navigation/types';

const QUOTES = [
  { minScore: 90, text: 'Outstanding! Your dedication is bearing real fruit.',    sub: 'Keep that momentum going.' },
  { minScore: 70, text: 'Great work — every review sharpens the mind and spirit.', sub: "You're building something lasting." },
  { minScore: 50, text: 'Good effort — consistency is the key to mastery.',        sub: 'Come back tomorrow and go further.' },
  { minScore: 0,  text: "Don't be discouraged — struggle is where growth happens.", sub: 'Every attempt makes you stronger.' },
];

function getQuote(score: number) {
  return QUOTES.find(q => score >= q.minScore) ?? QUOTES[QUOTES.length - 1];
}

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
  summaryItems: SummaryItem[];
  retakeAttemptId?: string;
  isFocused: boolean;
  onExit: () => void;
}

export function QuizResultScreen({
  setIds, setTitle, mode, quizName,
  total, correct, scorePct, timeSecs,
  summaryItems, retakeAttemptId, isFocused, onExit,
}: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { save, isPending, isError, error } = useQuizAttemptSave(retakeAttemptId);
  const saved = useRef(false);
  const [best, setBest] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(AUTO_EXIT_SECS);

  // Save once on mount — unified hook handles create vs update
  useEffect(() => {
    if (saved.current || total === 0) return;
    saved.current = true;
    save({ setIds, total, correct, mode, quizName, timeSecs, responses: summaryItems })
      .then(res => { setBest(res.best ?? null); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown only ticks when save is done AND this screen is in the foreground.
  // If user navigates to QuizSummary, isFocused becomes false and the interval
  // is cleared — so the auto-exit doesn't fire while they're reviewing answers.
  useEffect(() => {
    if (isPending || !isFocused) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); onExit(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isPending, isFocused, onExit]);

  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.alert;
  const isNewBest = best !== null && scorePct >= best;
  const quote = getQuote(scorePct);

  const openSummary = useCallback(() => {
    navigation.navigate('QuizSummary', {
      items: summaryItems,
      title: setTitle,
      scorePct,
      total,
      correct,
      exitToHub: true,
    });
  }, [navigation, summaryItems, setTitle, scorePct, total, correct]);

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

      {/* Motivational quote — same style as home screen verse card */}
      <View style={[styles.quoteCard, { backgroundColor: colors.accent }]}>
        <Typography preset="verse" color={colors.textOnAccent} style={[styles.quoteMark, styles.quoteTopLeft]}>"</Typography>
        <Typography preset="verse" color={colors.textOnAccent} style={[styles.quoteMark, styles.quoteBottomRight]}>"</Typography>
        <Typography preset="verse" color={colors.textOnAccent} style={styles.quoteText}>{quote.text}</Typography>
        <Typography preset="label" color={colors.textOnPrimaryMuted} style={styles.quoteSub}>{quote.sub}</Typography>
      </View>

      {/* Summary icon button */}
      <Pressable
        onPress={openSummary}
        style={({ pressed }) => [styles.reviewBtn, { opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="View summary"
      >
        <View style={[styles.reviewIcon, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <ListIcon size={22} color={colors.textSecondary} />
        </View>
        <Typography preset="caption" color={colors.textSecondary}>Review</Typography>
      </Pressable>

      {best !== null && (
        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
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
        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.alert }]}>
          <Typography preset="caption" color={colors.alert}>
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
    gap: spacing.lg,
  },
  sub:       { marginTop: -spacing.sm },
  scoreWrap: { alignItems: 'center', gap: spacing.s2 },
  // ponytail: fontSize 52 / lineHeight 64 are off-grid hero display values — no matching tokens
  scoreNumber: { fontSize: 52, fontWeight: fontWeights.bold, lineHeight: 64 },
  reviewBtn: { alignItems: 'center', gap: spacing.xs },
  reviewIcon: {
    width: layout.avatarMd,
    height: layout.avatarMd,
    borderRadius: layout.avatarMd / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius,
    borderWidth: 1,
  },
  quoteCard: {
    alignSelf: 'stretch',
    borderRadius: layout.cardRadiusLg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  quoteText: { fontStyle: 'italic', textAlign: 'center' },
  quoteSub: { textAlign: 'center' },
  // ponytail: fontSize 52 / lineHeight 56 are off-grid decorative values — no matching tokens
  quoteMark: { position: 'absolute', fontSize: 52, lineHeight: 56, opacity: 0.22 },
  quoteTopLeft: { top: spacing.sm, left: spacing.lg },
  quoteBottomRight: { bottom: spacing.sm, right: spacing.lg },
});
