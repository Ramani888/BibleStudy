import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Typography } from './Typography';
import { fontWeights, useTheme } from '../../theme';

interface ScoreRingProps {
  /** 0–100. Null/undefined → unscored dash. */
  pct: number | null;
  /** Ring accent color (usually scoreColor(pct)). */
  color: string;
  size?: number;
  strokeWidth?: number;
}

/** Circular progress ring with the score % centered — the signature quiz stat visual. */
export function ScoreRing({ pct, color, size = 132, strokeWidth = 10 }: ScoreRingProps) {
  const { colors } = useTheme();
  const scored = pct != null;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct ?? 0));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        {scored && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            // start at 12 o'clock
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={styles.center}>
        {scored
          ? <Typography style={[styles.value, { color, fontSize: size * 0.3, lineHeight: size * 0.34 }]}>{clamped}%</Typography>
          : <Typography style={[styles.value, { color: colors.textSecondary, fontSize: size * 0.3 }]}>—</Typography>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { fontWeight: fontWeights.bold, includeFontPadding: false },
});
