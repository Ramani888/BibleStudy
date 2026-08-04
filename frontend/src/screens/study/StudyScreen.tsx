import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorState } from '../../components/feedback';
import { Button, ProgressBar, Spacer, Typography } from '../../components/ui';
import { useCards, useStudySession } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import { CompletionScreen, FlashCardView } from './components';

type Props = LibraryScreenProps<'Study'>;

const ICON_SIZE = 20;
const STAT_ICON_SIZE = 14;

export function StudyScreen({ route, navigation }: Props) {
  const { setId, setTitle, isOwner = true } = route.params;

  const { data: cards = [], isLoading, isError, error, refetch } = useCards(setId);

  const {
    currentCard,
    currentIndex,
    isRevealed,
    isComplete,
    isShuffled,
    progress,
    results,
    skippedCount,
    hardCards,
    displayCards,
    handleFlip,
    handleDifficulty,
    handleSkip,
    toggleShuffle,
    handleRestart,
    handleRetryHard,
  } = useStudySession(cards, setId, isOwner);

  const handleAskAI = useCallback(() => {
    if (!currentCard) return;
    const prompt = `Explain this flashcard:\nQ: ${currentCard.question}\nA: ${currentCard.answer}`;
    navigation.navigate('AITab', { screen: 'AIChat', params: { autoSend: prompt } });
  }, [currentCard, navigation]);

  const handleExit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Typography preset="body" color={colors.textSecondary}>Loading cards…</Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Typography preset="h4" align="center">No cards in this set</Typography>
          <Spacer size={spacing[4]} />
          <Button label="Go Back" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    return (
      <SafeAreaView style={styles.safe}>
        <CompletionScreen
          total={displayCards.length}
          results={results}
          skippedCount={skippedCount}
          onRestart={handleRestart}
          onRetryHard={hardCards.length > 0 ? handleRetryHard : undefined}
          onExit={handleExit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.exitBtn}>
          <Icon name="close" size={ICON_SIZE} color={colors.primary} />
          <Typography preset="label" color={colors.primary}>Exit</Typography>
        </Pressable>
        {setTitle ? (
          <Typography preset="label" color={colors.textPrimary} numberOfLines={1} style={styles.headerTitle}>
            {setTitle}
          </Typography>
        ) : null}
        <View style={styles.headerRight}>
          <Pressable onPress={handleAskAI} hitSlop={12} disabled={!isRevealed}>
            <Icon name="sparkles-outline" size={ICON_SIZE} color={isRevealed ? colors.primary : colors.textDisabled} />
          </Pressable>
          <Pressable onPress={toggleShuffle} hitSlop={12}>
            <Icon name="shuffle-outline" size={ICON_SIZE} color={isShuffled ? colors.primary : colors.textDisabled} />
          </Pressable>
          <Typography preset="label" color={colors.textSecondary}>
            {currentIndex + 1} / {displayCards.length}
          </Typography>
        </View>
      </View>

      {/* Progress bar */}
      <ProgressBar progress={progress} style={styles.progress} />

      {/* Running session stats */}
      {(results.EASY + results.MEDIUM + results.HARD) > 0 && (
        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Icon name="checkmark" size={STAT_ICON_SIZE} color={colors.success} />
            <Typography preset="caption" color={colors.success}>{results.EASY}</Typography>
          </View>
          <View style={styles.statItem}>
            <Icon name="remove" size={STAT_ICON_SIZE} color={colors.warning} />
            <Typography preset="caption" color={colors.warning}>{results.MEDIUM}</Typography>
          </View>
          <View style={styles.statItem}>
            <Icon name="close" size={STAT_ICON_SIZE} color={colors.error} />
            <Typography preset="caption" color={colors.error}>{results.HARD}</Typography>
          </View>
        </View>
      )}

      {currentCard ? (
        <FlashCardView
          card={currentCard}
          isRevealed={isRevealed}
          currentIndex={currentIndex}
          onFlip={handleFlip}
          onDifficulty={handleDifficulty}
          onSkip={handleSkip}
        />
      ) : null}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  progress: { marginHorizontal: layout.screenPaddingH, marginBottom: spacing[4] },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    paddingVertical: spacing[2],
    marginHorizontal: layout.screenPaddingH,
    marginBottom: spacing[2],
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPaddingH },
});
