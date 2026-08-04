import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorState } from '../../components/feedback';
import { ProgressBar, Typography } from '../../components/ui';
import { useCards } from '../../hooks';
import { useQuizSession } from '../../hooks/useQuizSession';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import { QuizItemView, QuizResultScreen } from './components';
import type { QuizSelectableMode } from '../../types';

const ICON_SIZE = 20;
type Params = { setId: string; setTitle: string; mode?: QuizSelectableMode; isOwner?: boolean };

export function QuizScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<{ Quiz: Params }, 'Quiz'>>();
  const { setId, setTitle, mode = 'mix' } = params;

  const { data: cards = [], isLoading, isError, error, refetch } = useCards(setId);
  const s = useQuizSession(cards, mode);
  const goBack = () => navigation.goBack();

  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;

  let body: React.ReactNode;
  if (isLoading) {
    body = <View style={styles.center}><Typography preset="body" color={colors.textSecondary}>Loading…</Typography></View>;
  } else if (!s.isAvailable) {
    body = <View style={styles.center}><Typography preset="h4" align="center">Nothing to quiz here</Typography></View>;
  } else if (s.isComplete) {
    body = (
      <QuizResultScreen
        setId={setId} setTitle={setTitle} mode={mode}
        total={s.scoredTotal} correct={s.correctCount} scorePct={s.scorePct}
        onRetake={s.restart} onExit={goBack}
      />
    );
  } else {
    body = (
      <>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.exit}>
            <Icon name="close" size={ICON_SIZE} color={colors.primary} />
            <Typography preset="label" color={colors.primary}>Exit</Typography>
          </Pressable>
          <Typography preset="label" color={colors.textPrimary} numberOfLines={1} style={styles.title}>{setTitle}</Typography>
          <Typography preset="label" color={colors.textSecondary}>{s.index + 1} / {s.total}</Typography>
        </View>
        <ProgressBar progress={s.progress} style={styles.progress} />
        {s.item && (
          <QuizItemView
            item={s.item}
            submitted={s.submitted}
            lastCorrect={s.lastCorrect}
            isLast={s.index + 1 >= s.total}
            onSubmit={s.submit}
            onNext={s.next}
          />
        )}
      </>
    );
  }

  return <SafeAreaView style={styles.safe} edges={['top']}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing[3] },
  title: { flex: 1, textAlign: 'center', marginHorizontal: spacing[2] },
  exit: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  progress: { marginHorizontal: layout.screenPaddingH, marginBottom: spacing[4] },
});
