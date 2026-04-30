import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { FlashCard, SetCard } from '../../components/domain';
import { SetCardSkeleton } from '../../components/feedback';
import { Button, ProgressBar, Spacer, Typography } from '../../components/ui';
import { useCards, useRecordStudy, useSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { Difficulty } from '../../types';
import type { LibraryScreenProps } from '../../navigation/types';

type Props = LibraryScreenProps<'Study'>;

const SWIPE_THRESHOLD = 80;

// ─── Difficulty button config ─────────────────────────────────────────────────
const DIFF_CONFIG: { difficulty: Difficulty; label: string; emoji: string; color: string; bg: string }[] = [
  { difficulty: 'HARD',   label: 'Hard',   emoji: '😓', color: colors.error,   bg: colors.errorSurface   },
  { difficulty: 'MEDIUM', label: 'Medium', emoji: '🤔', color: colors.warning, bg: colors.warningSurface },
  { difficulty: 'EASY',   label: 'Easy',   emoji: '😊', color: colors.success, bg: colors.successSurface },
];

// ─── Completion screen ────────────────────────────────────────────────────────
interface CompletionProps {
  total: number;
  results: Record<Difficulty, number>;
  skippedCount: number;
  onRestart: () => void;
  onRetryHard?: () => void;
  onExit: () => void;
}

function CompletionScreen({ total, results, skippedCount, onRestart, onRetryHard, onExit }: CompletionProps) {
  const rated = results.EASY + results.MEDIUM + results.HARD;
  const score = rated > 0
    ? Math.round((results.EASY + results.MEDIUM * 0.5) / rated * 100)
    : 0;
  const scoreColor = score >= 80 ? colors.success : score >= 50 ? colors.warning : colors.error;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.completionWrap}>
      <Typography style={styles.completionEmoji}>🎉</Typography>
      <Typography preset="h2" align="center">Session Complete!</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.completionSub}>
        You reviewed {total} cards
      </Typography>

      {rated > 0 && (
        <View style={styles.scoreWrap}>
          <Typography style={[styles.scoreNumber, { color: scoreColor }]}>{score}%</Typography>
          <Typography preset="caption" color={colors.textSecondary}>score</Typography>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.successSurface }]}>
          <Typography preset="h3" color={colors.success}>{results.EASY}</Typography>
          <Typography preset="caption" color={colors.success}>Easy</Typography>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.warningSurface }]}>
          <Typography preset="h3" color={colors.warning}>{results.MEDIUM}</Typography>
          <Typography preset="caption" color={colors.warning}>Medium</Typography>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.errorSurface }]}>
          <Typography preset="h3" color={colors.error}>{results.HARD}</Typography>
          <Typography preset="caption" color={colors.error}>Hard</Typography>
        </View>
        {skippedCount > 0 && (
          <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
            <Typography preset="h3" color={colors.textSecondary}>{skippedCount}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Skipped</Typography>
          </View>
        )}
      </View>

      {results.HARD > 0 && onRetryHard && (
        <Button
          label={`Retry Hard (${results.HARD})`}
          variant="outline"
          onPress={onRetryHard}
          fullWidth
        />
      )}
      <View style={styles.completionBtns}>
        <Button label="Study Again" onPress={onRestart} variant="secondary" style={styles.flex} />
        <Button label="Done" onPress={onExit} style={styles.flex} />
      </View>
    </Animated.View>
  );
}

// ─── Set picker (shown when no set is active) ─────────────────────────────────
function SetPicker() {
  const navigation = useNavigation<Props['navigation']>();
  const { data: sets = [], isLoading } = useSets();

  if (isLoading) {
    return (
      <View style={styles.pickerWrap}>
        <SetCardSkeleton />
        <SetCardSkeleton />
        <SetCardSkeleton />
      </View>
    );
  }

  if (sets.length === 0) {
    return (
      <View style={styles.noSetWrap}>
        <Typography style={styles.noSetEmoji}>📚</Typography>
        <Typography preset="h3" align="center">No Sets Yet</Typography>
        <Typography preset="body" color={colors.textSecondary} align="center" style={styles.noSetSub}>
          Create a set in the Library to start studying.
        </Typography>
        <Spacer size={spacing[6]} />
        <Button label="Go to Library" onPress={() => navigation.navigate('LibraryTab')} variant="outline" />
      </View>
    );
  }

  return (
    <FlatList
      data={sets}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.pickerList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <Typography preset="h4" style={styles.pickerHeader}>Choose a Set to Study</Typography>
      }
      ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
      renderItem={({ item }) => (
        <SetCard
          set={item}
          onPress={() => navigation.navigate('Study', { setId: item.id, setTitle: item.title })}
        />
      )}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function StudyScreen({ route, navigation }: Props) {
  const { setId, setTitle } = route.params;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [hardCards, setHardCards] = useState<typeof cards>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [retryCards, setRetryCards] = useState<typeof cards>([]);
  const [results, setResults] = useState<Record<Difficulty, number>>({
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  });

  const { data: cards = [], isLoading } = useCards(setId);
  const { mutate: recordStudy } = useRecordStudy(setId);

  const displayCards = useMemo(() => {
    if (isRetryMode) return retryCards;
    if (!isShuffled || shuffleOrder.length !== cards.length) return cards;
    return shuffleOrder.map(i => cards[i]);
  }, [cards, retryCards, isRetryMode, isShuffled, shuffleOrder]);

  const currentCard = displayCards[currentIndex];
  const progress = displayCards.length > 0 ? currentIndex / displayCards.length : 0;

  // ── Swipe gesture shared values ──
  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);
  const isRevealedSV = useSharedValue(false);

  // Keep isRevealedSV in sync with JS state for worklet access
  useEffect(() => {
    isRevealedSV.value = isRevealed;
  }, [isRevealed, isRevealedSV]);

  // Reset swipe position when card advances
  useEffect(() => {
    swipeX.value = 0;
    swipeY.value = 0;
  }, [currentIndex, swipeX, swipeY]);

  const handleDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (!currentCard) return;

      // Record in backend (fire and forget — don't block UX)
      recordStudy(
        { id: currentCard.id, payload: { difficulty } },
        {
          onError: err =>
            Toast.show({ type: 'error', text1: 'Could not save', text2: getErrorMessage(err) }),
        },
      );

      if (difficulty === 'HARD') {
        setHardCards(prev => [...prev, currentCard]);
      }

      setResults(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));

      const next = currentIndex + 1;
      if (next >= displayCards.length) {
        setIsComplete(true);
      } else {
        setIsRevealed(false);
        setCurrentIndex(next);
      }
    },
    [currentCard, currentIndex, displayCards.length, recordStudy],
  );

  // ── Pan gesture — active only after card is flipped ──
  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      if (!isRevealedSV.value) return;
      swipeX.value = e.translationX;
      swipeY.value = e.translationY;
    })
    .onEnd(e => {
      if (!isRevealedSV.value) {
        swipeX.value = withSpring(0);
        swipeY.value = withSpring(0);
        return;
      }
      if (e.translationX > SWIPE_THRESHOLD) {
        // Swipe right → EASY: reset immediately so new card appears at rest
        swipeX.value = 0;
        swipeY.value = 0;
        runOnJS(handleDifficulty)('EASY');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        // Swipe left → HARD
        swipeX.value = 0;
        swipeY.value = 0;
        runOnJS(handleDifficulty)('HARD');
      } else {
        // Below threshold — snap back
        swipeX.value = withSpring(0);
        swipeY.value = withSpring(0);
      }
    });

  // ── Animated styles ──
  const cardSwipeStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      swipeX.value,
      [-150, 0, 150],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: swipeX.value },
        { translateY: swipeY.value * 0.25 },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const easyLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipeX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const hardLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(swipeX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const toggleShuffle = () => {
    if (!isShuffled) {
      const order = Array.from({ length: cards.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      setShuffleOrder(order);
      setIsShuffled(true);
    } else {
      setIsShuffled(false);
    }
    setCurrentIndex(0);
    setIsRevealed(false);
  };

  const handleSkip = useCallback(() => {
    setSkippedCount(prev => prev + 1);
    const next = currentIndex + 1;
    if (next >= displayCards.length) {
      setIsComplete(true);
    } else {
      setIsRevealed(false);
      setCurrentIndex(next);
    }
  }, [currentIndex, displayCards.length]);

  const handleRetryHard = () => {
    setRetryCards(hardCards);
    setIsRetryMode(true);
    setHardCards([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setSkippedCount(0);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  };

  const handleRestart = () => {
    if (isShuffled) {
      const order = Array.from({ length: cards.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      setShuffleOrder(order);
    }
    setIsRetryMode(false);
    setRetryCards([]);
    setHardCards([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setSkippedCount(0);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  };

  // ── No set selected ──
  if (!setId) {
    return (
      <SafeAreaView style={styles.safe}>
        <SetPicker />
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Typography preset="body" color={colors.textSecondary}>Loading cards…</Typography>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty ──
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

  // ── Complete ──
  if (isComplete) {
    return (
      <SafeAreaView style={styles.safe}>
        <CompletionScreen
          total={displayCards.length}
          results={results}
          skippedCount={skippedCount}
          onRestart={handleRestart}
          onRetryHard={hardCards.length > 0 ? handleRetryHard : undefined}
          onExit={() => navigation.navigate('LibraryTab')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Typography preset="label" color={colors.primary}>✕ Exit</Typography>
        </Pressable>
        {setTitle ? (
          <Typography preset="label" color={colors.textPrimary} numberOfLines={1} style={styles.headerTitle}>
            {setTitle}
          </Typography>
        ) : null}
        <View style={styles.headerRight}>
          <Pressable onPress={toggleShuffle} hitSlop={12}>
            <Typography preset="label" color={isShuffled ? colors.primary : colors.textDisabled}>🔀</Typography>
          </Pressable>
          <Typography preset="label" color={colors.textSecondary}>
            {currentIndex + 1} / {displayCards.length}
          </Typography>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <ProgressBar progress={progress} style={styles.progress} />

      {/* ── Running session stats ── */}
      {(results.EASY + results.MEDIUM + results.HARD) > 0 && (
        <View style={styles.sessionStats}>
          <Typography preset="caption" color={colors.success}>✓ {results.EASY}</Typography>
          <Typography preset="caption" color={colors.warning}>~ {results.MEDIUM}</Typography>
          <Typography preset="caption" color={colors.error}>✗ {results.HARD}</Typography>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* ── Card with swipe gesture ── */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={cardSwipeStyle}>
            <Animated.View
              key={currentCard.id}
              entering={SlideInRight.duration(300)}
              exiting={SlideOutLeft.duration(200)}
            >
              <FlashCard
                question={currentCard.question}
                answer={currentCard.answer}
                isBlurred={currentCard.isBlurred}
                onFlip={revealed => setIsRevealed(revealed)}
              />
            </Animated.View>

            {/* Swipe grade labels — appear when dragging after flip */}
            {isRevealed && (
              <>
                <Animated.View style={[styles.swipeLabel, styles.swipeLabelEasy, easyLabelStyle]}>
                  <Typography preset="label" color={colors.textOnPrimary}>EASY ✓</Typography>
                </Animated.View>
                <Animated.View style={[styles.swipeLabel, styles.swipeLabelHard, hardLabelStyle]}>
                  <Typography preset="label" color={colors.textOnPrimary}>HARD ✗</Typography>
                </Animated.View>
              </>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Note reveal after flip */}
        {isRevealed && currentCard.note && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.noteSection}>
            <Typography preset="caption" color={colors.textSecondary}>Note</Typography>
            <Typography preset="bodySm" color={colors.textSecondary} style={styles.noteText}>
              {currentCard.note}
            </Typography>
          </Animated.View>
        )}

        {/* First-card swipe hint */}
        {currentIndex === 0 && !isRevealed && (
          <Animated.View entering={FadeIn.duration(600)} style={styles.swipeHint}>
            <Typography preset="caption" color={colors.textDisabled} align="center">
              Flip · then swipe right for Easy, left for Hard
            </Typography>
          </Animated.View>
        )}

        <Spacer size={spacing[8]} />

        {/* ── Skip button (before flip only) ── */}
        {!isRevealed && (
          <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
            <Typography preset="label" color={colors.textDisabled}>Skip →</Typography>
          </Pressable>
        )}

        {/* ── Difficulty buttons (appear after flip) ── */}
        {isRevealed ? (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)}>
            <Typography preset="label" color={colors.textSecondary} align="center" style={styles.rateLabel}>
              How well did you know this?
            </Typography>
            <Spacer size={spacing[3]} />
            <View style={styles.diffRow}>
              {DIFF_CONFIG.map(({ difficulty, label, emoji, color, bg }) => (
                <Pressable
                  key={difficulty}
                  style={({ pressed }) => [
                    styles.diffBtn,
                    { backgroundColor: bg, borderColor: color, opacity: pressed ? 0.75 : 1 },
                  ]}
                  onPress={() => handleDifficulty(difficulty)}
                >
                  <Typography style={styles.diffEmoji}>{emoji}</Typography>
                  <Typography preset="label" color={color}>{label}</Typography>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(100)}>
            <Typography preset="caption" color={colors.textDisabled} align="center">
              Tap the card to reveal the answer
            </Typography>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
  },
  progress: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: spacing[4],
  },

  // Scroll
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[10],
  },

  // Swipe labels
  swipeLabel: {
    position: 'absolute',
    top: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    zIndex: 10,
  },
  swipeLabelEasy: {
    right: spacing[4],
    backgroundColor: colors.success,
  },
  swipeLabelHard: {
    left: spacing[4],
    backgroundColor: colors.error,
  },

  // First-card hint
  swipeHint: { marginTop: spacing[3] },

  // Note panel
  noteSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginTop: spacing[3],
    gap: spacing[1],
  },
  noteText: { lineHeight: 20 },

  // Skip
  skipBtn: { alignSelf: 'center', marginTop: spacing[2], paddingVertical: spacing[2] },

  // Difficulty
  rateLabel: { letterSpacing: 0.3 },
  diffRow: { flexDirection: 'row', gap: spacing[3] },
  diffBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: spacing[4],
    alignItems: 'center',
    gap: spacing[1.5],
  },
  diffEmoji: { fontSize: 24, lineHeight: 30 },

  // Completion
  completionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPaddingH,
    gap: spacing[4],
  },
  completionEmoji: { fontSize: 56, lineHeight: 68 },
  completionSub: { marginTop: -spacing[2] },
  scoreWrap: { alignItems: 'center', gap: spacing[0.5] },
  scoreNumber: { fontSize: 52, fontWeight: '700' as const, lineHeight: 64 },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[1],
  },
  completionBtns: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },

  // Header title / right cluster
  headerTitle: { flex: 1, textAlign: 'center', marginHorizontal: spacing[2] },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },

  // Running stats
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

  // Set picker
  pickerWrap: { padding: layout.screenPaddingH, gap: spacing[3] },
  pickerList: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
  pickerHeader: { marginBottom: spacing[3] },

  // No set / Loading / Empty
  noSetWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPaddingH,
  },
  noSetEmoji: { fontSize: 56, lineHeight: 68, marginBottom: spacing[2] },
  noSetSub: { marginTop: spacing[2] },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.screenPaddingH,
  },
  flex: { flex: 1 },
});
