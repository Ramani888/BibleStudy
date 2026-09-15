import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Button, Screen, ScoreRing, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ListIcon, TimerIcon, TrashIcon, TrophyIcon } from '../../components/icons';
import { useConfirmDialog, useDeleteQuizAttempt, useQuizAttemptResponses, useReQuiz, useRecentQuizAttempts } from '../../hooks';
import { ConfirmDialog } from '../../components/feedback';
import { GeneratingQuizModal } from './components';
import { fontSizes, fontWeights, useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import { formatDate, formatDateWithTime, formatDuration } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';
import { MODE_NAMES, scoreColor } from './quizUi';

import { useTranslation } from 'react-i18next';
type Params = QuizStackParamList['QuizDetail'];

export function QuizDetailScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ QuizDetail: Params }, 'QuizDetail'>>();
  const { mutate: deleteAttempt, isPending } = useDeleteQuizAttempt();
  const { show, dialogProps } = useConfirmDialog();
  const { data: attempts = [] } = useRecentQuizAttempts(50);

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
  const scoreCol = scoreColor(scorePct, colors);
  const modeLabel = mode ? t(`quiz:modeNames.${mode}`, MODE_NAMES[mode] ?? mode) : '—';
  const setsLabel = setTitles.length === 1 ? setTitles[0] : setTitles.join(' · ');
  const isPerfect = scored && scorePct === 100;
  const isRetaken = practicedAt !== createdAt;

  const handleDelete = useCallback(() => {
    show({
      title: t('quiz:detail.deleteTitle'),
      message: t('quiz:detail.deleteMessage'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: () => deleteAttempt(id, { onSuccess: () => navigation.goBack() }),
    });
  }, [show, deleteAttempt, id, navigation, t]);

  const { data: responsesData } = useQuizAttemptResponses(params.id);
  const storedResponses = responsesData?.responses as SummaryItem[] | undefined;

  // AI quizzes regenerate fresh questions from their topic/sets (charges credits);
  // old/real quizzes replay. useReQuiz handles the confirm + generate + fallback.
  const { reQuiz, dialogProps: reQuizDialog, isGenerating } = useReQuiz();
  const handleReQuiz = useCallback(
    () => reQuiz({ id, setIds, setTitles, mode, quizName, topic }, storedResponses),
    [reQuiz, id, setIds, setTitles, mode, quizName, topic, storedResponses],
  );

  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label={t('quiz:summary.reQuiz', 'Re-Quiz')} onPress={handleReQuiz} fullWidth />
    </View>
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={quizName ?? setsLabel ?? t('quiz:detail.title', 'Quiz Details')}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              {storedResponses && storedResponses.length > 0 && (
                <Pressable
                  style={({ pressed }) => pressed && styles.iconPressed}
                  onPress={() => navigation.navigate('QuizSummary' as any, {
                    items: storedResponses,
                    title: quizName ?? setsLabel,
                    scorePct, total, correct,
                  })}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('quiz:detail.viewSummary', 'View summary')}
                >
                  <ListIcon size={20} color={colors.textSecondary} />
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => pressed && styles.iconPressed}
                onPress={handleDelete}
                hitSlop={12}
                disabled={isPending}
                accessibilityRole="button"
              >
                <TrashIcon size={20} color={colors.alert} />
              </Pressable>
            </View>
          }
        />
      }
      footer={footer}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {isPerfect && <TrophyIcon size={32} color={colors.warning} />}
          <ScoreRing pct={scored ? scorePct : null} color={scoreCol} />
        </View>

        {/* ── Mode + sets chips ── */}
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Typography preset="caption" color={colors.textSecondary}>{modeLabel}</Typography>
          </View>
          {/* Source: topic, multiple sets, or a single set. */}
          {topic ? (
            <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.fromTopic', { topic, defaultValue: `Topic · ${topic}` })}</Typography>
            </View>
          ) : setIds.length > 1 ? (
            <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.setsCount', { count: setIds.length })}</Typography>
            </View>
          ) : setTitles.length === 1 && !!setTitles[0] ? (
            <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Typography preset="caption" color={colors.textSecondary}>{setTitles[0]}</Typography>
            </View>
          ) : null}
        </View>

        {/* ── Stat tiles ── */}
        {scored && (
          <View style={styles.statsRow}>
            <View style={[styles.statTile, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }]}>
              <CheckCircleIcon size={18} color={colors.success} />
              <Typography style={[styles.statValue, { color: colors.textPrimary }]}>{correct}/{total}</Typography>
              <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.correctLabel', 'Correct')}</Typography>
            </View>
            {timeSecs != null && (
              <View style={[styles.statTile, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }]}>
                <TimerIcon size={18} color={colors.textSecondary} />
                <Typography style={[styles.statValue, { color: colors.textPrimary }]}>{formatDuration(timeSecs)}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.timeSpent', 'Time spent')}</Typography>
              </View>
            )}
          </View>
        )}

        {/* ── Date info card ── */}
        <View style={[styles.card, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardRowLeft}>
              <ClockIcon size={16} color={colors.textSecondary} />
              <Typography preset="caption" color={colors.textSecondary}>
                {isRetaken ? t('quiz:detail.lastPracticed', 'Last practiced') : t('quiz:detail.practiced', 'Practiced')}
              </Typography>
            </View>
            <Typography preset="body" color={colors.textPrimary}>
              {formatDateWithTime(practicedAt)}
            </Typography>
          </View>

          {isRetaken && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.cardRow}>
                <View style={styles.cardRowLeft}>
                  <CalendarIcon size={16} color={colors.textSecondary} />
                  <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.firstAttempt', 'First attempt')}</Typography>
                </View>
                <Typography preset="body" color={colors.textPrimary}>
                  {formatDate(createdAt)}
                </Typography>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <ConfirmDialog {...dialogProps} />
      <ConfirmDialog {...reQuizDialog} />
      <GeneratingQuizModal visible={isGenerating} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
    alignItems: 'center',
  },

  // Hero
  hero: { alignItems: 'center', gap: spacing.sm },
  iconPressed: { opacity: 0.85 },

  // Stat tiles
  statsRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: layout.cardRadiusLg,
    borderWidth: 1,
  },
  statValue: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold },

  // Chips
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius,
    borderWidth: 1,
  },

  // Info card
  card: {
    width: '100%',
    borderRadius: layout.cardRadiusLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  cardRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: 1 },

  // Footer
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
});
