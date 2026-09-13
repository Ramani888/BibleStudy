import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';

interface VerdanceLogoProps {
  size?: number;
  /** true = full app-icon emblem (rounded gradient tile + mark); false = mark only. */
  withTile?: boolean;
  /** Mark color when withTile is false (defaults to white, for use on colored backgrounds). */
  color?: string;
}

// Canonical Verdance mark — a monoline "V" cradling a leaf (vesica). Single source
// of truth mirrors branding/verdance-emblem.svg + build-icons.mjs.
export function VerdanceLogo({ size = 96, withTile = false, color = '#FFFFFF' }: VerdanceLogoProps) {
  const paint = withTile ? 'url(#vMark)' : color;
  return (
    <Svg width={size} height={size} viewBox={withTile ? '0 0 1024 1024' : '312 313 400 400'}>
      {withTile && (
        <Defs>
          <LinearGradient id="vTile" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#8B5CF6" />
            <Stop offset="1" stopColor="#6366F1" />
          </LinearGradient>
          <LinearGradient id="vMark" x1="512" y1="336" x2="512" y2="690" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#EEF0FF" />
          </LinearGradient>
        </Defs>
      )}
      {withTile && <Rect width={1024} height={1024} rx={228} fill="url(#vTile)" />}
      <Path d="M360 372 L512 690 L664 372" stroke={paint} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M512 690 C 452 566 452 452 512 336 C 572 452 572 566 512 690 Z" fill={paint} />
    </Svg>
  );
}
