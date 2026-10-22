import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme';

/** Page-top fog: soft lilac top-left + warm top-right (canvas `--fog`). */
export const QMFog = React.memo(function QMFog({ height = 420 }: { height?: number }) {
  const { qm } = useTheme();
  return (
    <Svg pointerEvents="none" style={styles.fog} width="100%" height={height}>
      <Defs>
        {/* svg stops ignore rgba alpha → hex + stopOpacity */}
        <RadialGradient id="fogL" cx="0%" cy="0%" fx="0%" fy="0%" rx="120%" ry="60%">
          <Stop offset="0" stopColor={qm.fogLilac[0]} stopOpacity={qm.fogLilac[1]} />
          <Stop offset="0.6" stopColor={qm.fogLilac[0]} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="fogW" cx="100%" cy="0%" fx="100%" fy="0%" rx="90%" ry="50%">
          <Stop offset="0" stopColor={qm.fogWarm[0]} stopOpacity={qm.fogWarm[1]} />
          <Stop offset="0.6" stopColor={qm.fogWarm[0]} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#fogL)" />
      <Rect width="100%" height="100%" fill="url(#fogW)" />
    </Svg>
  );
});

const styles = StyleSheet.create({
  fog: { position: 'absolute', top: 0, left: 0, right: 0 },
});
