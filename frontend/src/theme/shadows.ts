import { Platform } from 'react-native';

const shadow = (
  elevation: number,
  color = '#000000',
  opacity = 0.08,
  radius = 8,
  offsetY = 2,
) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: {
      elevation,
    },
    default: {},
  });

export const shadows = {
  none: {},
  sm: shadow(2, '#000', 0.06, 4, 1),
  md: shadow(4, '#000', 0.08, 8, 2),
  lg: shadow(8, '#000', 0.10, 16, 4),
  xl: shadow(12, '#000', 0.12, 24, 6),
} as const;

export type ShadowKey = keyof typeof shadows;
