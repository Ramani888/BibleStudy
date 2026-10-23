import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { QMButton, QMScoreRing } from '../../../components/qm';
import { AnimatedPressable, Typography } from '../../../components/ui';
import { InfoIcon, LeafIcon } from '../../../components/icons';
import { useQuizAttemptSave, useStreak } from '../../../hooks';
import { useAuthStore } from '../../../store';
import { radius, spacing, useTheme } from '../../../theme';
import { requestReviewOnce } from '../../../utils/requestReview';
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

const RING = 176;
const RING_STROKE = 12;
const SECOND_BTN_H = 48;

const rise = (i: number) => FadeInUp.duration(320).delay(600 + i * 60);

interface Props {
  setIds: string[];
  setTitle: string;
  mode?: string;
  quizName?: string;
  topic?: string;
  total: number;
  correct: number;
  scorePct: number;
  timeSecs?: number;
  summaryItems: SummaryItem[];
  retakeAttemptId?: string;
  /** Ephemeral AI quiz — no real set/cards, so skip recording (SM-2/history). */
  ephemeral?: boolean;
  onExit: () => void;
}

/** Results never auto-close (canvas decision) — the user leaves with Done. */
export function QuizResultScreen({
  setIds, setTitle, mode, quizName, topic,
  total, correct, scorePct, timeSecs,
  summaryItems, retakeAttemptId, ephemeral, onExit,
}: Props) {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- QuizSummary / Quiz are root-stack routes
  const navigation = useNavigation<any>();
  const { save, isPending, isError } = useQuizAttemptSave(retakeAttemptId);
  const { data: streakData } = useStreak();
  const firstName = useAuthStore(s => s.user?.name?.split(' ')[0]);
  const saved = useRef(false);
  const [best, setBest] = useState<number | null>(null);

  // Close the study loop: re-quiz just the missed items as an ephemeral quiz
  // (works for both manual and AI quizzes — reconstructs QA cards from responses).
  const missed = summaryItems.filter(i => !i.isCorrect && i.mode !== 'read');
  const handlePracticeMissed = useCallback(() => {
    const generatedCards = missed.map(i => ({ question: i.prompt, answer: i.correctAnswer }));
    navigation.push('Quiz', {
      setIds: [], setTitles: [t('quiz:results.practiceMissed', 'Practice missed')],
      mode: 'mc', quizName: t('quiz:results.practiceMissed', 'Practice missed'), generatedCards,
      ephemeral: true, // a quick re-drill of missed items — not a new history entry
    });
  }, [missed, navigation, t]);

  // Save once on mount — unified hook handles create vs update.
  // Ephemeral AI quizzes have no real set/cards, so they are never recorded.
  useEffect(() => {
    if (saved.current || total === 0 || ephemeral) return;
    saved.current = true;
    save({ setIds, total, correct, mode, quizName, topic, timeSecs, responses: summaryItems })
      .then(res => { setBest(res.best ?? null); if (scorePct >= 80) requestReviewOnce('quiz_high_score'); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scored = total > 0;
  const perfect = scored && correct === total;
  const isNewBest = best !== null && scorePct >= best;
  const qk = getQuoteKey(scorePct);
  const name = firstName ?? '';
  const title = !scored ? t('quiz:qm.niceRead', 'Nicely read')
    : perfect ? t('quiz:qm.perfectTitle', 'Every one right')
    : scorePct >= 70 ? t('quiz:qm.titleGreat', { name, defaultValue: `Great work, ${name}` })
    : scorePct >= 50 ? t('quiz:qm.titleGood', { name, defaultValue: `Good effort, ${name}` })
    : t('quiz:qm.titleKeepGoing', { name, defaultValue: `Keep going, ${name}` });
  const minutes = timeSecs == null ? null : timeSecs < 60
    ? t('quiz:qm.seconds', { count: timeSecs })
    : t('quiz:qm.minutes', { count: Math.round(timeSecs / 60) });
  const streak = streakData?.streak ?? 0;
  const freezes = streakData?.freezes ?? 0;

  const openSummary = useCallback(() => {
    navigation.navigate('QuizSummary', {
      items: summaryItems, title: setTitle, scorePct, total, correct, exitToHub: true,
    });
  }, [navigation, summaryItems, setTitle, scorePct, total, correct]);

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.center}>
          <View>
            <QMScoreRing
              pct={scored ? scorePct : null}
              size={RING}
              stroke={RING_STROKE}
              caption={scored ? t('quiz:qm.rightOf', { correct, total, defaultValue: `${correct} of ${total} right` }) : undefined}
              a11yLabel={scored ? t('quiz:qm.ringA11y', { pct: scorePct }) : undefined}
            />
            {perfect && (
              <Animated.View entering={FadeIn.delay(1100).duration(300)} style={styles.leaf}>
                <LeafIcon size={46} color={qm.leaf} strokeWidth={1.6} />
              </Animated.View>
            )}
          </View>
          <Animated.View entering={rise(0)}>
            <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.title}>{title}</Typography>
          </Animated.View>
          <Animated.View entering={rise(1)}>
            <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.kind}>
              {t(`quiz:result.quotes.${qk}.sub`)}
            </Typography>
          </Animated.View>
        </View>

        {(streak > 0 || isNewBest) && (
          <Animated.View entering={rise(2)} style={styles.chips}>
            {streak > 0 && (
              <View style={[styles.chip, { backgroundColor: qm.leafBg }]}>
                <LeafIcon size={13} color={qm.leafText} filled />
                <Typography preset="qmLabel" color={qm.leafText}>{t('home:today.streak', { count: streak })}</Typography>
              </View>
            )}
            {streak > 0 && freezes > 0 && (
              <View style={[styles.chip, { backgroundColor: qm.lilac }]}>
                <Typography preset="qmLabel" color={qm.lilacInk}>{t('quiz:qm.restSaved', { count: freezes, defaultValue: `${freezes} rest day saved` })}</Typography>
              </View>
            )}
            {isNewBest && (
              <Animated.View entering={FadeIn.delay(200).duration(300)} style={[styles.chip, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmLabel" color={qm.goldText}>{t('quiz:qm.newBest', 'New best')}</Typography>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {isError && (
          <View style={[styles.warn, { backgroundColor: qm.errorBg }]} accessibilityRole="alert">
            <InfoIcon size={18} color={qm.warm} strokeWidth={2} />
            <Typography preset="qmBody" color={qm.warm} style={styles.flex}>
              {t('quiz:qm.saveFailed', 'Couldn’t save this result. Check your connection.')}
            </Typography>
          </View>
        )}

        {scored && (
          <Animated.View entering={rise(3)} style={styles.tiles}>
            <View style={[styles.tile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
              <Typography preset="qmTitle" color={qm.ink}>{t('quiz:qm.ofTotal', { correct, total })}</Typography>
              <Typography preset="qmCaption" color={qm.muted} style={styles.tileSub}>{t('quiz:qm.answeredRight', 'answered right')}</Typography>
            </View>
            {minutes && (
              <View style={[styles.tile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
                <Typography preset="qmTitle" color={qm.ink}>{minutes}</Typography>
                <Typography preset="qmCaption" color={qm.muted} style={styles.tileSub}>{t('quiz:qm.timeSpent', 'time spent')}</Typography>
              </View>
            )}
          </Animated.View>
        )}

        {best !== null && !isNewBest && (
          <Typography preset="qmButton" color={qm.body} align="center" style={styles.best}>
            {t('quiz:qm.best', { score: best, defaultValue: `Best: ${best}%` })}
          </Typography>
        )}
        <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.meta}>
          {topic ? `${setTitle} · ${topic}` : setTitle}
        </Typography>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: qm.hair }]}>
        {missed.length > 0 && (
          <QMButton
            label={t('quiz:qm.practiceMissed', { count: missed.length, defaultValue: `Practice the ${missed.length} you missed` })}
            onPress={handlePracticeMissed}
          />
        )}
        {summaryItems.length > 0 && (
          <AnimatedPressable scaleTo={0.97} onPress={openSummary} style={[styles.second, { backgroundColor: qm.lilac }]} accessibilityRole="button">
            <Typography preset="qmButton" color={qm.lilacInk}>{t('quiz:qm.everyAnswer', 'See every answer')}</Typography>
          </AnimatedPressable>
        )}
        {missed.length > 0 ? (
          <AnimatedPressable scaleTo={0.97} onPress={onExit} disabled={isPending} style={[styles.second, { backgroundColor: qm.field }]} accessibilityRole="button">
            <Typography preset="qmButtonLg" color={qm.ink}>{t('common:actions.done', 'Done')}</Typography>
          </AnimatedPressable>
        ) : (
          <QMButton label={t('common:actions.done', 'Done')} onPress={onExit} loading={isPending} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.s48, paddingBottom: spacing.xxl },
  center: { alignItems: 'center' },
  leaf: { position: 'absolute', right: -spacing.s6, top: spacing.xs },
  title: { marginTop: spacing.xl, marginBottom: spacing.s6 },
  kind: { maxWidth: 300 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.s18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.s5, paddingVertical: spacing.s6, paddingHorizontal: spacing.s10 + 1, borderRadius: radius.pill },
  warn: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, marginTop: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2 },
  tiles: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.xl },
  tile: { flex: 1, alignItems: 'center', padding: spacing.s14, borderRadius: radius.r18 },
  tileSub: { marginTop: spacing.s2 },
  best: { marginTop: spacing.lg },
  meta: { marginTop: spacing.s6 },
  footer: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.s14, paddingBottom: spacing.lg, borderTopWidth: 1 },
  second: { height: SECOND_BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
