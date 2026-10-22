import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, ReduceMotion, runOnJS, useAnimatedProps, useAnimatedReaction, useReducedMotion, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Typography } from '../ui';
import { qmFont, spacing, useTheme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DRAW_MS = 1100;
const DRAW_DELAY = 200;

/** Canvas score ring: leaf arc draws in, the % counts up with it. Null = unscored dash. `children` replace the number (Profile avatar). */
export function QMScoreRing({ pct, size, stroke, caption, a11yLabel, children }: {
  pct: number | null; size: number; stroke: number; caption?: string; a11yLabel?: string; children?: React.ReactNode;
}) {
  const { qm } = useTheme();
  const reduce = useReducedMotion();
  const target = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const r = (size - stroke) / 2 - 1;
  const len = 2 * Math.PI * r;
  const p = useSharedValue(reduce ? target : 0);
  const [shown, setShown] = useState(reduce ? target : 0);

  useEffect(() => {
    p.value = withDelay(DRAW_DELAY, withTiming(target, { duration: DRAW_MS, easing: Easing.bezier(0.3, 0.9, 0.3, 1), reduceMotion: ReduceMotion.System }));
  }, [p, target]);
  useAnimatedReaction(() => Math.round(p.value), (v, prev) => { if (v !== prev) runOnJS(setShown)(v); });
  const arc = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value / 100) }));

  const big = size * 0.27;
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel={a11yLabel}>
      <Svg width={size} height={size} style={styles.rot}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={qm.lilac} strokeWidth={stroke} fill="none" />
        {pct !== null && (
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={qm.leaf} strokeWidth={stroke} fill="none" strokeLinecap="round"
            strokeDasharray={len} animatedProps={arc}
          />
        )}
      </Svg>
      <View style={styles.center}>
        {children ?? <>
        <Typography style={[styles.num, { color: qm.ink, fontSize: big, lineHeight: big * 1.1 }]}>
          {pct === null ? '—' : shown}
          {pct !== null && <Typography style={[styles.num, { color: qm.ink, fontSize: big / 2 }]}>%</Typography>}
        </Typography>
        {caption ? <Typography preset="qmMeta" color={qm.muted} style={styles.caption}>{caption}</Typography> : null}
        </>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rot: { transform: [{ rotate: '-90deg' }] },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: qmFont.serifMedium, includeFontPadding: false },
  caption: { marginTop: spacing.xs },
});
