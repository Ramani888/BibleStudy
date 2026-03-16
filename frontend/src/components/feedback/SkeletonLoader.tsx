import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[styles.base, { width: width as number, height, borderRadius, opacity }, style]}
    />
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
});
