import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Animated version of Pressable — layout behaves exactly like a normal Pressable
const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Scale factor on press. Default 0.96 (4% smaller). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Drop-in replacement for Pressable with spring-scale + opacity feedback.
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
    scale.value = withSpring(scaleTo, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0.82, { duration: 80 });
    onPressIn?.(e);
  }, [scaleTo, onPressIn]);

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>((e) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 80 });
    onPressOut?.(e);
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
