import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { Button, Typography } from '../../../components/ui';
import { ListIcon, StarIcon, StarOutlineIcon } from '../../../components/icons';
import { useQuizAttemptSave } from '../../../hooks';
import { fontWeights, layout, spacing, useTheme } from '../../../theme';
import type { SummaryItem } from '../../../types';

const QUOTE_TIERS: { minScore: number; key: string }[] = [
  { minScore: 90, key: 'excellent' },
  { minScore: 70, key: 'great' },
  { minScore: 50, key: 'good' },
  { minScore: 0,  key: 'keepGoing' },
];

function getQuoteKey(score: number): string {
  return (QUOTE_TIERS.find(q => score >= q.minScore) ?? QUOTE_TIERS[QUOTE_TIERS.length - 1]).key;
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
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
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
  const qk = getQuoteKey(scorePct);
  const quote = {
    text: t(`quiz:result.quotes.${qk}.text`),
    sub: t(`quiz:result.quotes.${qk}.sub`),
  };

  const openSummary = useCallback(() => {
    (navigation as any).navigate('QuizSummary', {
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
      <Typography preset="h2" align="center">{t('quiz:results.quizComplete', 'Quiz Complete!')}</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.sub}>
        {setTitle}
      </Typography>

      <View style={styles.scoreWrap}>
        <Typography style={[styles.scoreNumber, { color: scoreColor }]}>{scorePct}%</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {t('quiz:results.scoreFraction', { correct, total, defaultValue: `${correct} / ${total} correct` })}
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
        accessibilityLabel={t('quiz:summary.title', 'View summary')}
      >
        <View style={[styles.reviewIcon, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <ListIcon size={22} color={colors.textSecondary} />
        </View>
        <Typography preset="caption" color={colors.textSecondary}>{t('quiz:results.reviewQuestions', 'Review')}</Typography>
      </Pressable>

      {best !== null && (
        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          {isNewBest
            ? <StarIcon size={16} color={colors.warning} />
            : <StarOutlineIcon size={16} color={colors.textSecondary} />
          }
          <Typography preset="caption" color={isNewBest ? colors.warning : colors.textSecondary}>
            {isNewBest ? t('quiz:results.newBest', 'New best!') : t('quiz:results.bestScore', { score: best, defaultValue: `Best: ${best}%` })}
          </Typography>
        </View>
      )}

      {isError && (
        <View style={[styles.pill, { backgroundColor: colors.surfaceMuted, borderColor: colors.alert }]}>
          <Typography preset="caption" color={colors.alert}>
            {t('quiz:results.saveFailed', { message: (error as any)?.message ?? t('common:status.unknownError', 'Unknown error'), defaultValue: `Save failed: ${(error as any)?.message ?? 'Unknown error'}` })}
          </Typography>
        </View>
      )}

      <Button
        label={isPending ? t('common:status.saving') : `${t('common:actions.done')} (${countdown})`}
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
