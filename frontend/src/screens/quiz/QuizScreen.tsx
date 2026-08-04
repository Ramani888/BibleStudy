import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorState } from '../../components/feedback';
import { Button, ProgressBar, Spacer, Typography } from '../../components/ui';
import { useCards } from '../../hooks';
import { useQuizSession, MIN_QUIZ_CARDS } from '../../hooks/useQuizSession';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import { QuizQuestionView, QuizResultScreen } from './components';

const ICON_SIZE = 20;

type QuizRouteParams = { setId: string; setTitle: string; isOwner?: boolean };

export function QuizScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<{ Quiz: QuizRouteParams }, 'Quiz'>>();
  const { setId, setTitle } = params;

  const { data: cards = [], isLoading, isError, error, refetch } = useCards(setId);
  const session = useQuizSession(cards);

  const goBack = () => navigation.goBack();

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <View style={styles.centerWrap}>
        <Typography preset="body" color={colors.textSecondary}>Loading quiz…</Typography>
      </View>
    );
  } else if (!session.isAvailable) {
    // Not enough cards to build 4-option questions.
    body = (
      <View style={styles.centerWrap}>
        <Icon name="help-circle-outline" size={48} color={colors.textDisabled} />
        <Spacer size={spacing[3]} />
        <Typography preset="h4" align="center">Not enough cards to quiz</Typography>
        <Spacer size={spacing[2]} />
        <Typography preset="body" color={colors.textSecondary} align="center">
          A quiz needs at least {MIN_QUIZ_CARDS} cards. This set has {cards.length}.
        </Typography>
        <Spacer size={spacing[4]} />
        <Button label="Go Back" variant="outline" onPress={goBack} />
      </View>
    );
  } else if (session.isComplete) {
    body = (
      <QuizResultScreen
        setId={setId}
        setTitle={setTitle}
        total={session.total}
        correct={session.correctCount}
        scorePct={session.scorePct}
        onRetake={session.restart}
        onExit={goBack}
      />
    );
  } else {
    body = (
      <>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.exitBtn}>
            <Icon name="close" size={ICON_SIZE} color={colors.primary} />
            <Typography preset="label" color={colors.primary}>Exit</Typography>
          </Pressable>
          {setTitle ? (
            <Typography preset="label" color={colors.textPrimary} numberOfLines={1} style={styles.headerTitle}>
              {setTitle}
            </Typography>
          ) : null}
          <Typography preset="label" color={colors.textSecondary}>
            {session.currentIndex + 1} / {session.total}
          </Typography>
        </View>

        <ProgressBar progress={session.progress} style={styles.progress} />

        {session.question ? (
          <QuizQuestionView
            question={session.question}
            selectedIndex={session.selectedIndex}
            isLast={session.currentIndex + 1 >= session.total}
            onPick={session.pick}
            onNext={session.next}
          />
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
  },
  headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: spacing[2] },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  progress: { marginHorizontal: layout.screenPaddingH, marginBottom: spacing[4] },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
});
