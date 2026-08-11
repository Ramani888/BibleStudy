import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, CloseCircleIcon } from '../../components/icons';
import { useTheme, spacing, layout, CARD_FILL_LIGHT, fontSizes, lineHeights } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SummaryItem } from '../../types';

type Params = RootStackParamList['QuizSummary'];
type Filter = 'all' | 'correct' | 'wrong';

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'correct', label: 'Correct' },
  { key: 'wrong',   label: 'Wrong'   },
];

const MODE_LABEL: Record<string, string> = {
  mc: 'Multiple Choice', story_mc: 'Story MC',
  type_answer: 'Type Answer', type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks', chunks: 'Reorder', read: 'Read',
};

export function QuizSummaryScreen() {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<{ QuizSummary: Params }, 'QuizSummary'>>();
  const { items, title, scorePct, total, correct, exitToHub } = params;

  const handleBack = () => {
    if (exitToHub) {
      (navigation as any).popToTop(); // pop back to App (hub), safe regardless of stack depth
    } else {
      navigation.goBack();
    }
  };

  const [filter, setFilter] = useState<Filter>('all');

  const filtered = filter === 'correct' ? items.filter(i => i.isCorrect)
    : filter === 'wrong' ? items.filter(i => !i.isCorrect)
    : items;

  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.alert;

  const renderItem = ({ item }: { item: SummaryItem }) => {
    const isRead = item.mode === 'read';
    return (
      <View style={[styles.card, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: item.isCorrect ? colors.success : isRead ? colors.border : colors.alert }]}>
        <View style={styles.cardHeader}>
          <Typography preset="caption" color={colors.textSecondary} style={styles.cardIndex}>
            Q{item.index + 1} · {MODE_LABEL[item.mode] ?? item.mode}
          </Typography>
          {isRead
            ? null
            : item.isCorrect
              ? <CheckCircleIcon size={16} color={colors.success} />
              : <CloseCircleIcon size={16} color={colors.alert} />
          }
        </View>

        <Typography preset="body" color={colors.textPrimary} style={styles.prompt}>
          {item.prompt}
        </Typography>

        {isRead ? (
          <Typography preset="caption" color={colors.textSecondary}>{item.correctAnswer}</Typography>
        ) : (
          <>
            <View style={styles.answerRow}>
              <Typography preset="caption" color={colors.textSecondary} style={styles.answerLabel}>Your answer</Typography>
              <Typography preset="caption" color={item.isCorrect ? colors.success : colors.alert} style={styles.answerValue}>
                {item.userAnswer}
              </Typography>
            </View>
            {!item.isCorrect && (
              <View style={styles.answerRow}>
                <Typography preset="caption" color={colors.textSecondary} style={styles.answerLabel}>Correct</Typography>
                <Typography preset="caption" color={colors.success} style={styles.answerValue}>
                  {item.correctAnswer}
                </Typography>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Summary" onBack={handleBack} />
      </View>

      {/* Score strip */}
      <View style={[styles.scoreStrip, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderBottomColor: colors.divider }]}>
        <Typography preset="h3" style={{ color: scoreColor }}>{scorePct}%</Typography>
        <Typography preset="caption" color={colors.textSecondary}>{correct}/{total} correct · {title}</Typography>
      </View>

      {/* Filter tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.divider }]}>
        {FILTER_LABELS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={({ pressed }) => [styles.tab, filter === key && { borderBottomColor: colors.accent, borderBottomWidth: 2 }, pressed && styles.tabPressed]}
            onPress={() => setFilter(key)}
          >
            <Typography
              preset="label"
              color={filter === key ? colors.accent : colors.textSecondary}
            >
              {label}
            </Typography>
          </Pressable>
        ))}
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
            <Typography preset="body" color={colors.textSecondary} align="center">No items</Typography>
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
  scoreStrip:  { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  tabs:        { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabPressed:  { opacity: 0.7 },
  list:        { padding: layout.screenPaddingH, gap: spacing.md },
  empty:       { paddingTop: spacing.s48 },
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIndex:   { flex: 1 },
  prompt:      { lineHeight: fontSizes.md * lineHeights.normal },
  answerRow:   { flexDirection: 'row', gap: spacing.sm },
  answerLabel: { width: spacing.s80 },
  answerValue: { flex: 1 },
});
