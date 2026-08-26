import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Button, Screen, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ListIcon, TimerIcon, TrashIcon, TrophyIcon } from '../../components/icons';
import { useConfirmDialog, useDeleteQuizAttempt, useQuizAttemptResponses, useRecentQuizAttempts } from '../../hooks';
import { ConfirmDialog } from '../../components/feedback';
import { fontWeights, useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import { formatDate, formatDateWithTime, formatDuration } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';

import { useTranslation } from 'react-i18next';
type Params = QuizStackParamList['QuizDetail'];

const MODE_LABEL: Record<string, string> = {
  mix: 'Mix', mc: 'Multiple Choice', story_mc: 'Story MC',
  type_answer: 'Type Answer', type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks', chunks: 'Reorder', read: 'Read',
};

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
  const timeSecs    = live?.timeSecs    ?? params.timeSecs;

  const scored = total > 0;
  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.alert;
  const modeLabel = mode ? (MODE_LABEL[mode] ?? mode) : '—';
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

  const handleReQuiz = useCallback(() => navigation.navigate('Quiz', {
    setIds,
    setTitles,
    mode: mode ?? 'mix',
    retakeAttemptId: id,
  }), [navigation, setIds, setTitles, mode, id]);

  const { data: responsesData } = useQuizAttemptResponses(params.id);
  const storedResponses = responsesData?.responses as SummaryItem[] | undefined;

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
                  accessibilityLabel="View summary"
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
          {scored ? (
            <Typography style={[styles.scoreNumber, { color: scoreColor }]}>
              {scorePct}%
            </Typography>
          ) : (
            <Typography style={[styles.scoreNumber, { color: colors.textSecondary }]}>—</Typography>
          )}
          {scored && (
            <View style={styles.correctRow}>
              <CheckCircleIcon size={14} color={colors.textSecondary} />
              <Typography preset="caption" color={colors.textSecondary}>
                {correct} / {total} correct
              </Typography>
            </View>
          )}
        </View>

        {/* ── Mode + sets chips ── */}
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Typography preset="caption" color={colors.textSecondary}>{modeLabel}</Typography>
          </View>
          {setIds.length > 1 && (
            <View style={[styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
              <Typography preset="caption" color={colors.textSecondary}>{setIds.length} sets</Typography>
            </View>
          )}
        </View>

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

          {timeSecs != null && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.cardRow}>
                <View style={styles.cardRowLeft}>
                  <TimerIcon size={16} color={colors.textSecondary} />
                  <Typography preset="caption" color={colors.textSecondary}>{t('quiz:detail.timeSpent', 'Time spent')}</Typography>
                </View>
                <Typography preset="body" color={colors.textPrimary}>
                  {formatDuration(timeSecs)}
                </Typography>
              </View>
            </>
          )}

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
  // ponytail: fontSize 72 and lineHeight 80 are off-grid hero display values — no matching tokens
  scoreNumber: { fontSize: 72, fontWeight: fontWeights.bold, lineHeight: 80, includeFontPadding: false },
  iconPressed: { opacity: 0.85 },
  correctRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

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
