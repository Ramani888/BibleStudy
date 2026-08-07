import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { layout, useTheme } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color,
  height = 6,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration: 400 });
  }, [progress, width]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: colors.gray200 }, style]}>
      <Animated.View style={[styles.fill, barStyle, { backgroundColor: color ?? colors.primary, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: layout.pillRadius,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: layout.pillRadius,
  },
});
