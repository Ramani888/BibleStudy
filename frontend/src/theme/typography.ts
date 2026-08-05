import { Platform } from 'react-native';

// Inter is bundled (assets/fonts/Inter-*.ttf, linked via react-native-asset).
// Per-weight family names resolve on both iOS (PostScript name) and Android
// (asset file base name). No Inter-Medium file → medium maps to SemiBold.
const inter = {
  regular: 'Inter-Regular',
  medium: 'Inter-SemiBold',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
};

const fontFamily = Platform.select({
  ios: inter,
  android: inter,
  default: inter,
})!;

export const fontFamilies = fontFamily;

export const fontSizes = {
  xs2: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 40,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/** Pre-built text style presets to use via Typography component */
export const textPresets = {
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
  },
  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
  },
  h3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes['2xl'] * lineHeights.tight,
  },
  h4: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  // Serene scripture serif — system fonts only (no bundled assets).
  verse: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xl * lineHeights.relaxed,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  buttonSm: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
} as const;

export type TextPreset = keyof typeof textPresets;
