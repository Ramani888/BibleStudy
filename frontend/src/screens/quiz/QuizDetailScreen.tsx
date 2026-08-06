import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Button, Screen, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { TrashIcon } from '../../components/icons';
import { useDeleteQuizAttempt, useRecentQuizAttempts } from '../../hooks';
import { type Theme, useTheme } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { QuizStackParamList } from '../../navigation/types';

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

  // Prefer live data from cache; fall back to nav params (covers first render before fetch)
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
  const scored = total > 0;
  const scoreColor = scorePct >= 80 ? colors.success : scorePct >= 50 ? colors.warning : colors.error;
  const modeLabel = mode ? (MODE_LABEL[mode] ?? mode) : '—';
  const setsLabel = setTitles.length === 1 ? setTitles[0] : setTitles.join(', ');

  const handleDelete = () => {
    Alert.alert('Delete Quiz', 'Remove this attempt from your history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteAttempt(id, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Quiz Details"
          onBack={() => navigation.goBack()}
          right={
            <Pressable onPress={handleDelete} hitSlop={12} disabled={isPending} accessibilityRole="button">
              <TrashIcon size={20} color={colors.error} />
            </Pressable>
          }
        />
      }
    >
      <View style={styles.container}>

        <View style={[styles.scoreCircle, { borderColor: scored ? scoreColor : colors.border }]}>
          {scored
            ? <Typography style={[styles.scoreText, { color: scoreColor }]}>{scorePct}%</Typography>
            : <Typography preset="caption" color={colors.textSecondary}>—</Typography>
          }
        </View>

        <View style={styles.infoGroup}>
          {quizName && <Row label="Name" value={quizName} colors={colors} styles={styles} />}
          <Row label={setIds.length > 1 ? 'Sets' : 'Set'} value={setsLabel} colors={colors} styles={styles} />
          <Row label="Mode" value={modeLabel} colors={colors} styles={styles} />
          {scored && <Row label="Score" value={`${correct} / ${total} correct`} colors={colors} styles={styles} />}
          <Row label="Created" value={formatDate(createdAt)} colors={colors} styles={styles} />
          {practicedAt !== createdAt && <Row label="Last Practiced" value={formatDate(practicedAt)} colors={colors} styles={styles} />}
        </View>

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
      </View>
    </Screen>
  );
}

function Row({ label, value, colors, styles }: { label: string; value: string; colors: any; styles: any }) {
  return (
    <View style={styles.row}>
      <Typography preset="caption" color={colors.textSecondary} style={styles.rowLabel}>{label}</Typography>
      <Typography preset="body" color={colors.textPrimary} style={styles.rowValue} numberOfLines={2}>{value}</Typography>
    </View>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    container: { flex: 1, padding: layout.screenPaddingH, alignItems: 'center', gap: spacing[4] },
    scoreCircle: {
      width: 140, height: 140, borderRadius: 70, borderWidth: 4,
      alignItems: 'center', justifyContent: 'center', marginTop: spacing[6],
    },
    scoreText: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, includeFontPadding: false },
    infoGroup: {
      width: '100%', borderRadius: 14, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.backgroundCard, overflow: 'hidden',
    },
    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: spacing[4], paddingVertical: spacing[3],
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    rowLabel: { flex: 0 },
    rowValue: { flex: 1, textAlign: 'right' },
  });
