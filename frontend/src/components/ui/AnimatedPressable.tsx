import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { triggerHaptic } from '../../utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// Animated version of Pressable — layout behaves exactly like a normal Pressable
const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Scale factor on press, applied at half strength (0.96 → 2% smaller) for a calm tap. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Drop-in replacement for Pressable with a subtle scale + opacity feedback (no spring bounce).
 * Uses createAnimatedComponent so layout properties (flex, width, etc.) on
 * the `style` prop work exactly as they would on a plain Pressable.
 */
export function AnimatedPressable({
  children,
  onPressIn,
  onPressOut,
  scaleTo = 0.96,
  style,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>((e) => {
    triggerHaptic('light');
    scale.value = withTiming(1 - (1 - scaleTo) / 2, { duration: 100 });
    opacity.value = withTiming(0.82, { duration: 80 });
    onPressIn?.(e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaleTo, onPressIn]);

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>((e) => {
    scale.value = withTiming(1, { duration: 120 });
    opacity.value = withTiming(1, { duration: 80 });
    onPressOut?.(e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPressOut]);

  return (
    <ReanimatedPressable
      style={[style, animStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      {children}
    </ReanimatedPressable>
  );
}
