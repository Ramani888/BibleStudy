import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, shadows, spacing } from '../../theme';
import { Typography } from '../ui/Typography';

interface FlashCardProps {
  question: string;
  answer: string;
  isBlurred?: boolean;
  onFlip?: (revealed: boolean) => void;
}

const DURATION = 300;

export function FlashCard({ question, answer, isBlurred, onFlip }: FlashCardProps) {
  const flip = useSharedValue(0); // 0 = question side, 1 = answer side

  const handlePress = () => {
    const next = flip.value === 0 ? 1 : 0;
    flip.value = withTiming(next, { duration: DURATION });
    onFlip?.(next === 1);
  };

  // Front face: visible at flip=0, hidden at flip=1
  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    const opacity = interpolate(flip.value, [0, 0.5, 0.5, 1], [1, 1, 0, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  // Back face: hidden at flip=0, visible at flip=1
  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    const opacity = interpolate(flip.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
    };
  });

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* ── Front — Question ── */}
      <Animated.View style={[styles.face, styles.front, frontStyle]}>
        <View style={styles.labelRow}>
          <View style={[styles.labelDot, { backgroundColor: colors.info }]} />
          <Typography preset="label" color={colors.info}>
            Question
          </Typography>
        </View>
        <Typography preset="bodyLg" style={styles.text} align="center">
          {question}
        </Typography>
        <Typography preset="caption" color={colors.textDisabled} style={styles.tapHint}>
          Tap to reveal answer
        </Typography>
      </Animated.View>

      {/* ── Back — Answer ── */}
      <Animated.View style={[styles.face, styles.back, backStyle]}>
        <View style={styles.labelRow}>
          <View style={[styles.labelDot, { backgroundColor: colors.success }]} />
          <Typography preset="label" color={colors.success}>
            Answer
          </Typography>
        </View>
        <Typography
          preset="bodyLg"
          style={[styles.text, isBlurred && styles.blurred]}
          align="center"
        >
          {answer}
        </Typography>
        <Typography preset="caption" color={colors.textDisabled} style={styles.tapHint}>
          Tap to flip back
        </Typography>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    width: '100%',
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    ...shadows.lg,
  },
  front: {
    borderTopColor: colors.info,
    borderTopWidth: 3,
  },
  back: {
    borderTopColor: colors.success,
    borderTopWidth: 3,
  },
  labelRow: {
    position: 'absolute',
    top: spacing[4],
    left: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    lineHeight: 28,
    paddingHorizontal: spacing[2],
  },
  blurred: {
    opacity: 0.08,
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing[4],
  },
});
