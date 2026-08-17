import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import { TrophyIcon, StarIcon, FlameIcon, SparklesIcon } from '../icons';
import { palette } from '../../theme';

/**
 * Full-screen particle burst (GPay-style): emojis + icons shoot from the
 * centre, arc under gravity, spin, and fade. Absolute-fill overlay with
 * pointerEvents="none" — never blocks content. Honors Reduce Motion.
 *
 * Change `trigger` to replay (e.g. pass the achievement key or score).
 */

const EMOJIS = ['🎉', '✨', '⭐', '🥳', '🎊', '👏', '💫', '🌟'];
const ICONS = [TrophyIcon, StarIcon, FlameIcon, SparklesIcon] as const;
const ICON_COLORS = [palette.indigo500, palette.violet400, palette.warning, '#F5DF5D'];

interface Particle {
  v: Animated.Value;
  kind: 'emoji' | 'icon';
  char: string;
  Icon: (typeof ICONS)[number];
  color: string;
  size: number;
  dx: number;
  dyPeak: number;
  dyFinal: number;
  rot: number;
  duration: number;
  delay: number;
}

interface CelebrationBurstProps {
  trigger?: unknown;
  count?: number;
  originYFraction?: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function CelebrationBurst({
  trigger,
  count = 45,
  originYFraction = 0.42,
}: CelebrationBurstProps) {
  const { width, height } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(v => mounted && setReduceMotion(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const maxReach = Math.hypot(width, height) * 0.6;
    return Array.from({ length: count }, () => {
      const kind: 'emoji' | 'icon' = Math.random() < 0.62 ? 'emoji' : 'icon';
      const angle = rand(0, Math.PI * 2);
      const dist = rand(0.45, 1) * maxReach;
      const dx = Math.cos(angle) * dist;
      const dyOut = Math.sin(angle) * dist;
      const gravity = rand(height * 0.15, height * 0.45);
      return {
        v: new Animated.Value(0),
        kind,
        char: pick(EMOJIS),
        Icon: pick(ICONS),
        color: pick(ICON_COLORS),
        size: kind === 'emoji' ? rand(22, 40) : rand(24, 36),
        dx,
        dyPeak: dyOut,
        dyFinal: dyOut + gravity,
        rot: rand(-360, 360),
        duration: rand(2800, 3800),
        delay: rand(0, 520),
      };
    });
  }, [count, width, height]);

  const groupRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    particles.forEach(p => p.v.setValue(0));
    const anims = particles.map(p =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.v, {
          toValue: 1,
          duration: p.duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const group = Animated.parallel(anims);
    groupRef.current = group;
    group.start();
    return () => group.stop();
  }, [trigger, reduceMotion, particles]);

  if (reduceMotion) return null;

  const originX = width / 2;
  const originY = height * originYFraction;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const style = {
          position: 'absolute' as const,
          left: originX,
          top: originY,
          opacity: p.v.interpolate({ inputRange: [0, 0.06, 0.72, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: p.v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dx, p.dx * 1.05] }) },
            { translateY: p.v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dyPeak, p.dyFinal] }) },
            { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            { scale: p.v.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0.2, 1.1, 0.85] }) },
          ],
        };
        return (
          <Animated.View key={i} style={style}>
            {p.kind === 'emoji'
              ? <Text style={{ fontSize: p.size }}>{p.char}</Text>
              : <p.Icon size={p.size} color={p.color} />}
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}
