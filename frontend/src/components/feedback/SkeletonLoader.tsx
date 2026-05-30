import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing } from '../../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIMMER_COLORS: [string, string, string] = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.55)',
  'rgba(255,255,255,0)',
];

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) },
    ],
  }));

  return (
    <View
      style={[
        styles.base,
        { width: width as number, height, borderRadius, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={SHIMMER_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Pre-built skeleton for a set card */
export function SetCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={18} width="60%" borderRadius={6} />
      <View style={{ height: 8 }} />
      <Skeleton height={13} width="80%" borderRadius={6} />
      <View style={{ height: 16 }} />
      <Skeleton height={13} width="30%" borderRadius={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray200,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
});
