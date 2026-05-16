import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import Icon from 'react-native-vector-icons/Ionicons';
import { FlashCard } from '../../../components/domain';
import { Spacer, Typography } from '../../../components/ui';
import { colors, layout, spacing } from '../../../theme';
import type { Card } from '../../../types';
import type { Difficulty } from '../../../types';

const SWIPE_THRESHOLD = 80;
const ICON_SIZE = 20;
const DIFF_ICON_SIZE = 24;

const DIFF_CONFIG: { difficulty: Difficulty; label: string; iconName: string; color: string; bg: string }[] = [
  { difficulty: 'HARD',   label: 'Hard',   iconName: 'sad-outline',          color: colors.error,   bg: colors.errorSurface   },
  { difficulty: 'MEDIUM', label: 'Medium', iconName: 'help-circle-outline',  color: colors.warning, bg: colors.warningSurface },
  { difficulty: 'EASY',   label: 'Easy',   iconName: 'happy-outline',        color: colors.success, bg: colors.successSurface },
];

interface FlashCardViewProps {
  card: Card;
  isRevealed: boolean;
  currentIndex: number;
  onFlip: (revealed: boolean) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  onSkip: () => void;
}

export function FlashCardView({
  card,
  isRevealed,
  currentIndex,
  onFlip,
  onDifficulty,
  onSkip,
}: FlashCardViewProps) {
  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);
  const isRevealedSV = useSharedValue(false);

  useEffect(() => {
    isRevealedSV.value = isRevealed;
  }, [isRevealed, isRevealedSV]);

  useEffect(() => {
    swipeX.value = 0;
    swipeY.value = 0;
  }, [currentIndex, swipeX, swipeY]);

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
        swipeX.value = 0;
        swipeY.value = 0;
        runOnJS(onDifficulty)('EASY');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        swipeX.value = 0;
        swipeY.value = 0;
        runOnJS(onDifficulty)('HARD');
      } else {
        swipeX.value = withSpring(0);
        swipeY.value = withSpring(0);
      }
    });

  const cardSwipeStyle = useAnimatedStyle(() => {
    const rotate = interpolate(swipeX.value, [-150, 0, 150], [-12, 0, 12], Extrapolation.CLAMP);
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

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardSwipeStyle}>
          <Animated.View
            key={card.id}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
          >
            <FlashCard
              question={card.question}
              answer={card.answer}
              isBlurred={card.isBlurred}
              onFlip={onFlip}
            />
          </Animated.View>

          {isRevealed && (
            <>
              <Animated.View style={[styles.swipeLabel, styles.swipeLabelEasy, easyLabelStyle]}>
                <Typography preset="label" color={colors.textOnPrimary}>EASY</Typography>
              </Animated.View>
              <Animated.View style={[styles.swipeLabel, styles.swipeLabelHard, hardLabelStyle]}>
                <Typography preset="label" color={colors.textOnPrimary}>HARD</Typography>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </GestureDetector>

      {isRevealed && card.note && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.noteSection}>
          <Typography preset="caption" color={colors.textSecondary}>Note</Typography>
          <Typography preset="bodySm" color={colors.textSecondary} style={styles.noteText}>
            {card.note}
          </Typography>
        </Animated.View>
      )}

      {currentIndex === 0 && !isRevealed && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.swipeHint}>
          <Typography preset="caption" color={colors.textDisabled} align="center">
            Flip · then swipe right for Easy, left for Hard
          </Typography>
        </Animated.View>
      )}

      <Spacer size={spacing[8]} />

      {!isRevealed && (
        <Pressable onPress={onSkip} hitSlop={12} style={styles.skipBtn}>
          <Typography preset="label" color={colors.textDisabled}>Skip</Typography>
          <Icon name="arrow-forward" size={ICON_SIZE} color={colors.textDisabled} />
        </Pressable>
      )}

      {isRevealed ? (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)}>
          <Typography preset="label" color={colors.textSecondary} align="center" style={styles.rateLabel}>
            How well did you know this?
          </Typography>
          <Spacer size={spacing[3]} />
          <View style={styles.diffRow}>
            {DIFF_CONFIG.map(({ difficulty, label, iconName, color, bg }) => (
              <Pressable
                key={difficulty}
                style={({ pressed }) => [
                  styles.diffBtn,
                  { backgroundColor: bg, borderColor: color, opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => onDifficulty(difficulty)}
              >
                <Icon name={iconName} size={DIFF_ICON_SIZE} color={color} />
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
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[10] },
  swipeLabel: {
    position: 'absolute',
    top: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    zIndex: 10,
  },
  swipeLabelEasy: { right: spacing[4], backgroundColor: colors.success },
  swipeLabelHard: { left: spacing[4], backgroundColor: colors.error },
  swipeHint: { marginTop: spacing[3] },
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
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    alignSelf: 'center',
    marginTop: spacing[2],
    paddingVertical: spacing[2],
  },
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
});
