import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMBackButton, QMButton, QMConfirmDialog, QMScoreRing } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CheckIcon, ChevronRightIcon, ClockIcon, ListIcon, RefreshIcon, TrashIcon } from '../../components/icons';
import {
  useConfirmDialog, useCreditBalance, useDeleteQuizAttempt, useQuizAttemptResponses, useReQuiz, useRecentQuizAttempts,
  useTabBarSpace,
} from '../../hooks';
import { GeneratingQuizModal } from './components';
import { useTheme, spacing, radius } from '../../theme';
import { formatDateWithTime } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';
import { qmModeName, reQuizSource } from './quizUi';

const TOUCH = 44;
const RING = 160;
const RING_STROKE = 11;
const AI_QUIZ_COST = 2;
const ROW_H = 52;

type Params = QuizStackParamList['QuizDetail'];

const rise = (i: number) => FadeInUp.duration(320).delay(500 + i * 80);

export function QuizDetailScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- QuizSummary is a root-stack route, outside the Quiz stack
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ QuizDetail: Params }, 'QuizDetail'>>();
  const { mutate: deleteAttempt, isPending } = useDeleteQuizAttempt();
  const { show, dialogProps } = useConfirmDialog();
  const { data: attempts = [] } = useRecentQuizAttempts(50);
  const { data: credits } = useCreditBalance();

  const live = attempts.find(a => a.id === params.id);
  const id        = params.id;
  const setIds    = live?.setIds    ?? params.setIds;
  const setTitles = live?.setTitles ?? params.setTitles;
  const mode      = live?.mode      ?? params.mode;
  const scorePct  = live?.scorePct  ?? params.scorePct;
  const correct   = live?.correct   ?? params.correct;
  const total     = live?.total     ?? params.total;
  const createdAt   = live?.createdAt   ?? params.createdAt;
  const practicedAt = live?.practicedAt ?? params.practicedAt ?? createdAt;
  const quizName    = live?.quizName    ?? params.quizName;
  const topic       = live?.topic       ?? params.topic;
  const timeSecs    = live?.timeSecs    ?? params.timeSecs;

  const scored = total > 0;
  const setsLabel = setTitles.join(' · ');
  const isRetaken = practicedAt !== createdAt;
  const missed = total - correct;
  const source = topic
    ? t('quiz:detail.fromTopic', { topic })
    : setIds.length > 1 ? t('quiz:detail.setsCount', { count: setIds.length }) : setTitles[0] || null;

  const { data: responsesData } = useQuizAttemptResponses(params.id);
  const storedResponses = responsesData?.responses as SummaryItem[] | undefined;
  const hasAnswers = !!storedResponses && storedResponses.length > 0;

  const handleDelete = useCallback(() => {
    show({
      title: t('quiz:qm.deleteTitle', 'Delete this quiz?'),
      message: t('quiz:qm.deleteMessage', 'It will be removed from your history. Your cards and sets stay as they are.'),
      confirmLabel: t('common:actions.delete'),
      cancelLabel: t('quiz:qm.keepIt', 'Keep it'),
      variant: 'danger',
      onConfirm: () => deleteAttempt(id, { onSuccess: () => navigation.goBack() }),
    });
  }, [show, deleteAttempt, id, navigation, t]);

  // AI quizzes regenerate fresh questions from their topic/sets (charges credits);
  // old/real quizzes replay. useReQuiz handles the confirm + generate + fallback.
  const { reQuiz, dialogProps: reQuizDialog, isGenerating } = useReQuiz();
  const handleReQuiz = useCallback(
    () => reQuiz({ id, setIds, setTitles, mode, quizName, topic }, storedResponses),
    [reQuiz, id, setIds, setTitles, mode, quizName, topic, storedResponses],
  );
  const charged = !!reQuizSource({ setIds, topic }, storedResponses);
  const lacking = charged && !!credits && credits.balance < AI_QUIZ_COST;
  const hint = !charged
    ? t('quiz:qm.freeRetake', 'Free to retake')
    : credits
      ? t('quiz:qm.retakeHint', { cost: AI_QUIZ_COST, balance: credits.balance, defaultValue: 'New questions · {{cost}} credits. You have {{balance}}.' })
      : t('quiz:qm.costCredits', { count: AI_QUIZ_COST });

  const openSummary = () => navigation.navigate('QuizSummary', {
    items: storedResponses, title: quizName ?? setsLabel, scorePct, total, correct,
  });

  const minutes = timeSecs == null ? null : timeSecs < 60
    ? t('quiz:qm.seconds', { count: timeSecs, defaultValue: `${timeSecs} sec` })
    : t('quiz:qm.minutes', { count: Math.round(timeSecs / 60), defaultValue: `${Math.round(timeSecs / 60)} min` });

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <QMBackButton onPress={() => navigation.goBack()} label={t('common:actions.back', 'Back')} />
          <Pressable
            onPress={handleDelete}
            disabled={isPending}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.dim]}
            accessibilityRole="button"
            accessibilityLabel={t('quiz:qm.deleteA11y', 'Delete this quiz')}
          >
            <TrashIcon size={20} color={qm.muted} />
          </Pressable>
        </View>

        <View style={styles.center}>
          <QMScoreRing
            pct={scored ? scorePct : null}
            size={RING}
            stroke={RING_STROKE}
            caption={scored ? t('quiz:qm.correct', 'correct') : undefined}
            a11yLabel={scored ? t('quiz:qm.ringA11y', { pct: scorePct, defaultValue: `${scorePct} percent correct` }) : undefined}
          />
          <Animated.View entering={rise(0)}>
            <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.title}>
              {quizName ?? setsLabel ?? t('quiz:detail.title')}
            </Typography>
          </Animated.View>
          <Animated.View entering={rise(1)} style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: qm.lilac }]}>
              <Typography preset="qmLabel" color={qm.lilacInk}>{qmModeName(mode, t)}</Typography>
            </View>
            {source && (
              <View style={[styles.chip, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmLabel" color={qm.goldText} numberOfLines={1}>{source}</Typography>
              </View>
            )}
          </Animated.View>
        </View>

        {scored && (
          <Animated.View entering={rise(2)} style={styles.tiles}>
            <View style={[styles.tile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
              <CheckIcon size={20} color={qm.leaf} />
              <Typography preset="qmTitle" color={qm.ink} style={styles.tileNum}>
                {t('quiz:qm.ofTotal', { correct, total, defaultValue: `${correct} of ${total}` })}
              </Typography>
              <Typography preset="qmMeta" color={qm.muted}>{t('quiz:qm.answeredRight', 'answered right')}</Typography>
            </View>
            {minutes && (
              <View style={[styles.tile, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
                <ClockIcon size={20} color={qm.link} />
                <Typography preset="qmTitle" color={qm.ink} style={styles.tileNum}>{minutes}</Typography>
                <Typography preset="qmMeta" color={qm.muted}>{t('quiz:qm.timeSpent', 'time spent')}</Typography>
              </View>
            )}
          </Animated.View>
        )}

        <Animated.View entering={rise(3)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <View style={styles.cardRow}>
            <Typography preset="qmBodyMd" color={qm.muted}>
              {isRetaken ? t('quiz:detail.lastPracticed', 'Last practiced') : t('quiz:detail.practiced', 'Practiced')}
            </Typography>
            <Typography preset="qmButton" color={qm.ink}>{formatDateWithTime(practicedAt)}</Typography>
          </View>
          {isRetaken && (
            <View style={[styles.cardRow, styles.cardRowTop, { borderTopColor: qm.hair }]}>
              <Typography preset="qmBodyMd" color={qm.muted}>{t('quiz:qm.firstTry', 'First try')}</Typography>
              <Typography preset="qmButton" color={qm.ink}>{formatDateWithTime(createdAt)}</Typography>
            </View>
          )}
        </Animated.View>

        {hasAnswers && (
          <Animated.View entering={rise(4)}>
            <AnimatedPressable scaleTo={0.97} onPress={openSummary} style={[styles.link, { backgroundColor: qm.lilac }]} accessibilityRole="button">
              <ListIcon size={22} color={qm.lilacInk} />
              <View style={styles.flex}>
                <Typography preset="qmBodyLg" color={qm.lilacInk}>{t('quiz:qm.everyAnswer', 'See every answer')}</Typography>
                {missed > 0 && (
                  <Typography preset="qmMeta" color={qm.lilacInk} style={styles.linkSub}>
                    {t('quiz:qm.includingMissed', { count: missed, defaultValue: `Including the ${missed} you missed` })}
                  </Typography>
                )}
              </View>
              <ChevronRightIcon size={18} color={qm.lilacInk} strokeWidth={2} />
            </AnimatedPressable>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: qm.bg, borderTopColor: qm.hair, paddingBottom: spacing.s14 + tabSpace }]}>
        <QMButton icon={RefreshIcon} label={t('quiz:qm.quizAgain', 'Quiz me again')} onPress={handleReQuiz} />
        <Typography preset="qmMeta" color={lacking ? qm.warm : qm.muted} align="center" style={styles.hint}>{hint}</Typography>
      </View>

      <QMConfirmDialog {...dialogProps} />
      <QMConfirmDialog {...reQuizDialog} />
      <GeneratingQuizModal visible={isGenerating} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.s10 },
  center: { alignItems: 'center', marginTop: spacing.s6 },
  title: { marginTop: spacing.s18, marginBottom: spacing.s10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  chip: { paddingVertical: spacing.s6, paddingHorizontal: spacing.md, borderRadius: radius.pill, maxWidth: '100%' },
  tiles: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.xxl },
  tile: { flex: 1, borderRadius: radius.r20, padding: spacing.lg },
  tileNum: { marginTop: spacing.s6 },
  card: { marginTop: spacing.md, borderRadius: radius.r20, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  cardRow: { minHeight: ROW_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cardRowTop: { borderTopWidth: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.r20 },
  linkSub: { marginTop: spacing.s2, opacity: 0.8 },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.s14, borderTopWidth: 1 },
  hint: { marginTop: spacing.sm },
});
