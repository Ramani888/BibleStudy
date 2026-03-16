import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Toast from 'react-native-toast-message';

import { FlashCard } from '../../components/domain';
import { Button, ProgressBar, Spacer, Typography } from '../../components/ui';
import { useCards, useRecordStudy } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { Difficulty } from '../../types';
import type { AppTabParamList } from '../../navigation/types';

type StudyNav = BottomTabNavigationProp<AppTabParamList>;

// ─── Difficulty button ────────────────────────────────────────────────────────
const DIFF_CONFIG: { difficulty: Difficulty; label: string; emoji: string; color: string; bg: string }[] = [
  { difficulty: 'HARD',   label: 'Hard',   emoji: '😓', color: colors.error,   bg: colors.errorSurface   },
  { difficulty: 'MEDIUM', label: 'Medium', emoji: '🤔', color: colors.warning, bg: colors.warningSurface },
  { difficulty: 'EASY',   label: 'Easy',   emoji: '😊', color: colors.success, bg: colors.successSurface },
];

// ─── Completion screen ────────────────────────────────────────────────────────
interface CompletionProps {
  total: number;
  results: Record<Difficulty, number>;
  onRestart: () => void;
  onExit: () => void;
}

function CompletionScreen({ total, results, onRestart, onExit }: CompletionProps) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.completionWrap}>
      <Typography style={styles.completionEmoji}>🎉</Typography>
      <Typography preset="h2" align="center">Session Complete!</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.completionSub}>
        You reviewed {total} cards
      </Typography>

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
      </View>

      <View style={styles.completionBtns}>
        <Button label="Study Again" onPress={onRestart} variant="secondary" style={styles.flex} />
        <Button label="Done" onPress={onExit} style={styles.flex} />
      </View>
    </Animated.View>
  );
}

// ─── No set selected state ────────────────────────────────────────────────────
function NoSetSelected() {
  const navigation = useNavigation<StudyNav>();
  return (
    <View style={styles.noSetWrap}>
      <Typography style={styles.noSetEmoji}>📚</Typography>
      <Typography preset="h3" align="center">Choose a Set to Study</Typography>
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.noSetSub}>
        Open a study set from the Library and tap the Study button.
      </Typography>
      <Spacer size={spacing[6]} />
      <Button
        label="Go to Library"
        onPress={() => navigation.navigate('LibraryTab')}
        variant="outline"
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function StudyScreen({ route }: { route?: { params?: { setId?: string; setTitle?: string } } }) {
  const params = route?.params;
  const setId = params?.setId;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<Record<Difficulty, number>>({
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  });

  const { data: cards = [], isLoading } = useCards(setId ?? '');
  const { mutate: recordStudy } = useRecordStudy(setId ?? '');

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? currentIndex / cards.length : 0;

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

      setResults(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));

      const next = currentIndex + 1;
      if (next >= cards.length) {
        setIsComplete(true);
      } else {
        setIsRevealed(false);
        setCurrentIndex(next);
      }
    },
    [currentCard, currentIndex, cards.length, recordStudy],
  );

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  };

  const navigation = useNavigation<StudyNav>();

  // ── No set selected ──
  if (!setId) {
    return (
      <SafeAreaView style={styles.safe}>
        <NoSetSelected />
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
          total={cards.length}
          results={results}
          onRestart={handleRestart}
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
        <Typography preset="label" color={colors.textSecondary}>
          {currentIndex + 1} / {cards.length}
        </Typography>
      </View>

      {/* ── Progress bar ── */}
      <ProgressBar progress={progress} style={styles.progress} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* ── Card ── */}
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

        <Spacer size={spacing[8]} />

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
