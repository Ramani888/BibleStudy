import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Screen, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CalendarIcon, CheckCircleIcon, ClockIcon, ListIcon, RefreshIcon, TrashIcon, TrophyIcon } from '../../components/icons';
import { useDeleteQuizAttempt, useQuizAttemptResponses, useRecentQuizAttempts } from '../../hooks';
import { fontWeights, type Theme, useTheme } from '../../theme';
import { formatDate, formatDateWithTime, formatDuration } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';

type Params = QuizStackParamList['QuizDetail'];

const MODE_LABEL: Record<string, string> = {
  mix: 'Mix', mc: 'Multiple Choice', story_mc: 'Story MC',
  type_answer: 'Type Answer', type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks', chunks: 'Reorder', read: 'Read',
};

export function QuizDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ QuizDetail: Params }, 'QuizDetail'>>();
  const { mutate: deleteAttempt, isPending } = useDeleteQuizAttempt();
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
  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.error;
  const modeLabel = mode ? (MODE_LABEL[mode] ?? mode) : '—';
  const setsLabel = setTitles.length === 1 ? setTitles[0] : setTitles.join(' · ');
  const isPerfect = scored && scorePct === 100;
  const isRetaken = practicedAt !== createdAt;

  const handleDelete = () => {
    Alert.alert('Delete Quiz', 'Remove this attempt from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteAttempt(id, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  const { data: responsesData } = useQuizAttemptResponses(params.id);
  const storedResponses = responsesData?.responses as SummaryItem[] | undefined;

  const footer = (
    <Animated.View
      entering={FadeInDown.delay(320).springify().damping(20)}
      style={[styles.footer, { borderTopColor: colors.border }]}
    >
      <Button
        label="Re-Quiz"
        onPress={() => navigation.navigate('Quiz', {
          setIds,
          setTitles,
          mode: mode ?? 'mix',
          retakeAttemptId: id,
        })}
        fullWidth
      />
    </Animated.View>
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={quizName ?? setsLabel ?? 'Quiz Details'}
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              {storedResponses && storedResponses.length > 0 && (
                <Pressable
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
              <Pressable onPress={handleDelete} hitSlop={12} disabled={isPending} accessibilityRole="button">
                <TrashIcon size={20} color={colors.error} />
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
        <Animated.View entering={FadeInDown.delay(0).springify().damping(20)} style={styles.hero}>
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
        </Animated.View>

        {/* ── Mode + sets chips ── */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(20)} style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <Typography preset="caption" color={colors.textSecondary}>{modeLabel}</Typography>
          </View>
          {setIds.length > 1 && (
            <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Typography preset="caption" color={colors.textSecondary}>{setIds.length} sets</Typography>
            </View>
          )}
        </Animated.View>

        {/* ── Date info card ── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify().damping(20)}
          style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
        >
          <View style={styles.cardRow}>
            <View style={styles.cardRowLeft}>
              <ClockIcon size={16} color={colors.textSecondary} />
              <Typography preset="caption" color={colors.textSecondary}>
                {isRetaken ? 'Last practiced' : 'Practiced'}
              </Typography>
            </View>
            <Typography preset="body" color={colors.textPrimary}>
              {formatDateWithTime(practicedAt)}
            </Typography>
          </View>

          {timeSecs != null && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardRow}>
                <View style={styles.cardRowLeft}>
                  <RefreshIcon size={16} color={colors.textSecondary} />
                  <Typography preset="caption" color={colors.textSecondary}>Time spent</Typography>
                </View>
                <Typography preset="body" color={colors.textPrimary}>
                  {formatDuration(timeSecs)}
                </Typography>
              </View>
            </>
          )}

          {isRetaken && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardRow}>
                <View style={styles.cardRowLeft}>
                  <CalendarIcon size={16} color={colors.textSecondary} />
                  <Typography preset="caption" color={colors.textSecondary}>First attempt</Typography>
                </View>
                <Typography preset="body" color={colors.textPrimary}>
                  {formatDate(createdAt)}
                </Typography>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: layout.screenPaddingH,
      paddingTop: spacing[8],
      paddingBottom: spacing[6],
      gap: spacing[6],
      alignItems: 'center',
    },

    // Hero
    hero: { alignItems: 'center', gap: spacing[2] },
    scoreNumber: { fontSize: 72, fontWeight: fontWeights.bold, lineHeight: 80, includeFontPadding: false },
    correctRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

    // Chips
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
    chips: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' },
    chip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
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
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[4],
    },
    cardRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    divider: { height: 1 },

    // Footer
    footer: {
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[4],
      borderTopWidth: 1,
      gap: spacing[3],
    },
  });
