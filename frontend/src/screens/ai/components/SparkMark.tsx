import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../../theme';

/** Canvas Ask mark: lilac-filled sparkle, optional small gold spark. */
export function SparkMark({ size, small = true }: { size: number; small?: boolean }) {
  const { qm } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill={qm.lilac} stroke={qm.violet} strokeWidth={1.4} strokeLinejoin="round" />
      {small && (
        <Path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill={qm.goldBg} stroke={qm.goldText} strokeWidth={1.4} strokeLinejoin="round" />
      )}
    </Svg>
  );
}
