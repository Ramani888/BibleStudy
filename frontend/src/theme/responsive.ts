import { useWindowDimensions } from 'react-native';

/**
 * Responsive scaling layer — copied from the Meditation project.
 * Every layout was measured against a ~390dp-wide Figma frame.
 */

export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 916;
export const TABLET_BREAKPOINT = 600;
export const MAX_CONTENT_WIDTH = 480;

export function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface Responsive {
  width: number;
  height: number;
  isLandscape: boolean;
  isTablet: boolean;
  scale: (size: number, factor?: number) => number;
  vScale: (size: number, factor?: number) => number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;

  const wRatio = Math.min(width, MAX_CONTENT_WIDTH) / BASE_WIDTH;
  const hRatio = Math.min(1, height / BASE_HEIGHT);

  const scale = (size: number, factor = 0.5) =>
    Math.round(size + (size * wRatio - size) * factor);
  const vScale = (size: number, factor = 1) =>
    Math.round(size + (size * hRatio - size) * factor);

  return { width, height, isLandscape, isTablet, scale, vScale };
}
