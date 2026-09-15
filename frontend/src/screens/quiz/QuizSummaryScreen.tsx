import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterChip, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, CloseCircleIcon, ShareIcon } from '../../components/icons';
import { useTheme, spacing, layout, CARD_FILL_LIGHT, fontSizes, lineHeights } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';
import { useReferral } from '../../hooks';
import { shareToWhatsApp, buildReferralLink } from '../../utils';
import { MODE_NAMES } from './quizUi';

import { useTranslation } from 'react-i18next';
type Params = RootStackParamList['QuizSummary'];
type Filter = 'all' | 'correct' | 'wrong';

export function QuizSummaryScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<{ QuizSummary: Params }, 'QuizSummary'>>();
  const { items, exitToHub } = params;

  const handleBack = useCallback(() => {
    if (exitToHub) {
      (navigation as any).popToTop();
    } else {
      navigation.goBack();
    }
  }, [exitToHub, navigation]);

  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => filter === 'correct' ? items.filter(i => i.isCorrect)
      : filter === 'wrong' ? items.filter(i => !i.isCorrect)
      : items,
    [filter, items],
  );

  const correctCount = useMemo(() => items.filter(i => i.isCorrect).length, [items]);
  const wrongCount = items.length - correctCount;

  const { data: referral } = useReferral();
  const handleShare = useCallback(() => {
    const link = buildReferralLink(referral?.code);
    shareToWhatsApp(
      t('quiz:summary.shareMessage', {
        correct: correctCount,
        total: items.length,
        url: link,
        defaultValue: 'I scored {{correct}}/{{total}} on a Bible quiz in Verdance! 📖 Can you beat me? {{url}}',
      }),
      'quiz_result',
    );
  }, [referral?.code, correctCount, items.length, t]);

  const renderItem = useCallback(({ item }: { item: SummaryItem }) => {
    const isRead = item.mode === 'read';
    const ok = item.isCorrect;
    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Typography preset="caption" color={colors.textSecondary}>
            Q{item.index + 1} · {t(`quiz:modes.${item.mode}`, MODE_NAMES[item.mode] ?? item.mode)}
          </Typography>
          {!isRead && (
            <View style={[styles.badge, { backgroundColor: ok ? colors.successSoft : colors.errorSurface }]}>
              {ok
                ? <CheckCircleIcon size={14} color={colors.success} />
                : <CloseCircleIcon size={14} color={colors.alert} />}
              <Typography preset="caption" color={ok ? colors.success : colors.alert}>
                {ok ? t('quiz:summary.correct', 'Correct') : t('quiz:summary.incorrect', 'Incorrect')}
              </Typography>
            </View>
          )}
        </View>

        <Typography preset="label" color={colors.textPrimary} style={styles.prompt}>
          {item.prompt}
        </Typography>

        {isRead ? (
          <View style={[styles.answerBox, { backgroundColor: colors.surfaceMuted }]}>
            <Typography preset="body" color={colors.textPrimary}>{item.correctAnswer}</Typography>
          </View>
        ) : (
          <>
            <View style={[styles.answerBox, { backgroundColor: ok ? colors.successSoft : colors.errorSurface }]}>
              <Typography preset="caption" color={colors.textSecondary}>{t('quiz:summary.yourAnswer', 'Your answer')}</Typography>
              <Typography preset="body" color={ok ? colors.success : colors.alert}>{item.userAnswer}</Typography>
            </View>
            {!ok && (
              <View style={[styles.answerBox, { backgroundColor: colors.successSoft }]}>
                <Typography preset="caption" color={colors.textSecondary}>{t('quiz:summary.correctAnswer', 'Correct')}</Typography>
                <Typography preset="body" color={colors.success}>{item.correctAnswer}</Typography>
              </View>
            )}
          </>
        )}
      </View>
    );
  }, [colors, isDark, t]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title={t('quiz:summary.title')}
          onBack={handleBack}
          right={
            <Pressable onPress={handleShare} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common:actions.share', 'Share')}>
              <ShareIcon size={22} color={colors.textPrimary} />
            </Pressable>
          }
        />
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        <FilterChip label={`${t('common:filter.all', 'All')} ${items.length}`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label={`${t('quiz:summary.correct', 'Correct')} ${correctCount}`} active={filter === 'correct'} onPress={() => setFilter('correct')} />
        <FilterChip label={`${t('quiz:summary.incorrect', 'Incorrect')} ${wrongCount}`} active={filter === 'wrong'} onPress={() => setFilter('wrong')} />
      </View>

      <View style={styles.flex}>
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.index)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography preset="body" color={colors.textSecondary} align="center">{t('common:status.noResults', 'No items')}</Typography>
          </View>
        }
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  flex:        { flex: 1 },
  filters:     { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md },
  list:        { padding: layout.screenPaddingH, gap: spacing.md },
  empty:       { paddingTop: spacing.s48 },
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s2,
    borderRadius: layout.pillRadius,
  },
  prompt:      { lineHeight: fontSizes.md * lineHeights.normal },
  answerBox: {
    borderRadius: layout.cardRadiusSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.s2,
  },
});
