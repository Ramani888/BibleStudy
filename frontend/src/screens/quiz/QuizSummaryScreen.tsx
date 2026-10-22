import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { QMBackButton, QMSegmented, qmRowEnter } from '../../components/qm';
import { Typography } from '../../components/ui';
import { ShareUpIcon } from '../../components/icons';
import { useTheme, spacing, radius } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';
import { useReferral } from '../../hooks';
import { shareToWhatsApp, buildReferralLink } from '../../utils';
import { qmModeName } from './quizUi';

type Params = RootStackParamList['QuizSummary'];
type Filter = 'all' | 'correct' | 'wrong';

const TOUCH = 44;

export function QuizSummaryScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const { qm } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- popToTop lives on the stack navigator
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<{ QuizSummary: Params }, 'QuizSummary'>>();
  const { items, title, exitToHub } = params;

  const handleBack = useCallback(() => {
    if (exitToHub) navigation.popToTop();
    else navigation.goBack();
  }, [exitToHub, navigation]);

  const [filter, setFilter] = useState<Filter>('all');
  const scoredItems = useMemo(() => items.filter(i => i.mode !== 'read'), [items]);
  const correctCount = useMemo(() => scoredItems.filter(i => i.isCorrect).length, [scoredItems]);
  const wrongCount = scoredItems.length - correctCount;
  const filtered = useMemo(
    () => filter === 'correct' ? scoredItems.filter(i => i.isCorrect)
      : filter === 'wrong' ? scoredItems.filter(i => !i.isCorrect)
      : items,
    [filter, items, scoredItems],
  );

  const { data: referral } = useReferral();
  const handleShare = useCallback(() => {
    const link = buildReferralLink(referral?.code);
    shareToWhatsApp(
      t('quiz:summary.shareMessage', {
        correct: correctCount,
        total: scoredItems.length,
        url: link,
        defaultValue: 'I scored {{correct}}/{{total}} on a Bible quiz in Verdance! 📖 Can you beat me? {{url}}',
      }),
      'quiz_result',
    );
  }, [referral?.code, correctCount, scoredItems.length, t]);

  const renderItem = useCallback(({ item, index }: { item: SummaryItem; index: number }) => {
    const read = item.mode === 'read';
    const ok = item.isCorrect;
    const [badgeBg, badgeInk] = read ? [qm.field, qm.muted] : ok ? [qm.leafBg, qm.leafText] : [qm.errorBg, qm.warm];
    return (
      <Animated.View entering={qmRowEnter(index)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        <View style={styles.cardHead}>
          <Typography preset="qmMeta" color={qm.muted} style={styles.flex} numberOfLines={1}>
            {t('quiz:qm.questionN', { n: item.index + 1, defaultValue: `Question ${item.index + 1}` })} · {qmModeName(item.mode, t)}
          </Typography>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Typography preset="qmChip" color={badgeInk}>
              {read ? t('quiz:qm.practice', 'Practice') : ok ? t('quiz:qm.right', 'Right') : t('quiz:qm.missed', 'Missed')}
            </Typography>
          </View>
        </View>
        <Typography preset="qmTile" color={qm.ink} style={styles.prompt}>{item.prompt}</Typography>
        {read ? (
          <View style={[styles.box, { backgroundColor: qm.field }]}>
            <Typography preset="qmBodyMd" color={qm.ink}>{item.correctAnswer}</Typography>
          </View>
        ) : (
          <>
            <View style={[styles.box, { backgroundColor: qm.field }]}>
              <Typography preset="qmCaption" color={qm.muted}>{t('quiz:qm.yourAnswer', 'Your answer')}</Typography>
              <Typography preset="qmBodyMd" color={ok ? qm.ink : qm.warm} style={styles.boxText}>{item.userAnswer || '—'}</Typography>
            </View>
            {!ok && (
              <View style={[styles.box, styles.boxGap, { backgroundColor: qm.leafBg }]}>
                <Typography preset="qmCaption" color={qm.leafText}>{t('quiz:qm.correctAnswer', 'Correct answer')}</Typography>
                <Typography preset="qmBodyMd" color={qm.ink} style={styles.boxText}>{item.correctAnswer}</Typography>
              </View>
            )}
          </>
        )}
      </Animated.View>
    );
  }, [qm, t]);

  const header = (
    <View>
      <View style={styles.topRow}>
        <QMBackButton onPress={handleBack} label={t('common:actions.back', 'Back')} />
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.share, { backgroundColor: qm.field }, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('quiz:qm.shareScore', 'Share your score')}
        >
          <ShareUpIcon size={19} color={qm.ink} strokeWidth={2} />
        </Pressable>
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.title}>{t('quiz:qm.everyAnswerTitle', 'Every answer')}</Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>
        {t('quiz:qm.summarySub', { title, correct: correctCount, total: scoredItems.length, defaultValue: `${title} · ${correctCount} of ${scoredItems.length} right` })}
      </Typography>
      <View style={styles.seg}>
        <QMSegmented
          label={t('quiz:qm.everyAnswerTitle', 'Every answer')}
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: t('quiz:qm.filterAll', { count: items.length, defaultValue: `All ${items.length}` }) },
            { key: 'correct', label: t('quiz:qm.filterRight', { count: correctCount, defaultValue: `Right ${correctCount}` }) },
            { key: 'wrong', label: t('quiz:qm.filterMissed', { count: wrongCount, defaultValue: `Missed ${wrongCount}` }) },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.index)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.empty}>{t('quiz:qm.noneHere', 'No questions here.')}</Typography>
        }
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  list: { paddingHorizontal: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  share: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.s6, marginBottom: spacing.xs },
  seg: { marginTop: spacing.lg, marginBottom: spacing.lg },
  sep: { height: spacing.s10 },
  empty: { marginTop: spacing.s30 },
  card: { padding: spacing.lg, borderRadius: radius.r20 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingVertical: spacing.xs, paddingHorizontal: spacing.s10, borderRadius: radius.pill },
  prompt: { marginTop: spacing.sm },
  box: { marginTop: spacing.s10, paddingVertical: spacing.s10, paddingHorizontal: spacing.md, borderRadius: radius.r12 },
  boxGap: { marginTop: spacing.sm },
  boxText: { marginTop: spacing.s2 },
});
