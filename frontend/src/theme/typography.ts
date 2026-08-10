import { Platform, TextStyle } from 'react-native';

/**
 * Typography — Meditation project (exact) + BibleStudy textPresets.
 * Inter is bundled (assets/fonts/Inter-*.ttf, linked via react-native-asset).
 */
export const fontFamily = {
  regular:        'Inter-Regular',
  semibold:       'Inter-SemiBold',
  bold:           'Inter-Bold',
  semiboldItalic: 'Inter-SemiBoldItalic',
} as const;

export const fontSize = {
  timer:    60,
  h1:       32,
  title:    24,
  subtitle: 18,
  body:     16,
  label:    14,
  caption:  12,
  f11: 11, f13: 13, f15: 15, f17: 17, f20: 20,
  f22: 22, f26: 26, f28: 28, f34: 34, f40: 40, f44: 44,
} as const;

export type TypographyVariant =
  | 'timer' | 'title' | 'subtitle'
  | 'body' | 'bodyStrong'
  | 'label' | 'labelStrong'
  | 'status';

/** Meditation-style variant → TextStyle. Color applied by caller. */
export const typography: Record<TypographyVariant, TextStyle> = {
  timer:       { fontFamily: fontFamily.semibold, fontSize: fontSize.timer },
  title:       { fontFamily: fontFamily.semibold, fontSize: fontSize.title },
  subtitle:    { fontFamily: fontFamily.semibold, fontSize: fontSize.subtitle },
  body:        { fontFamily: fontFamily.regular,  fontSize: fontSize.body },
  bodyStrong:  { fontFamily: fontFamily.semibold, fontSize: fontSize.body },
  label:       { fontFamily: fontFamily.regular,  fontSize: fontSize.label },
  labelStrong: { fontFamily: fontFamily.semibold, fontSize: fontSize.label },
  status:      { fontFamily: fontFamily.semibold, fontSize: fontSize.caption },
};

// ─── BibleStudy text presets (used by <Typography preset="…"> component) ──────

/** BibleStudy font size scale. */
export const fontSizes = {
  xs2: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20,
  '2xl': 24, '3xl': 28, '4xl': 34, '5xl': 40,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium:  '500' as const,
  semiBold: '600' as const,
  bold:    '700' as const,
};

// Alias so existing imports of fontFamilies keep working
export const fontFamilies = {
  regular:  fontFamily.regular,
  medium:   fontFamily.semibold,
  semiBold: fontFamily.semibold,
  bold:     fontFamily.bold,
};

export const lineHeights = { tight: 1.2, normal: 1.5, relaxed: 1.75 } as const;
const lh = lineHeights;

export const textPresets = {
  h1:       { fontFamily: fontFamily.bold,     fontSize: fontSizes['4xl'], fontWeight: fontWeights.bold,    lineHeight: fontSizes['4xl'] * lh.tight },
  h2:       { fontFamily: fontFamily.bold,     fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold,    lineHeight: fontSizes['3xl'] * lh.tight },
  h3:       { fontFamily: fontFamily.semibold, fontSize: fontSizes['2xl'], fontWeight: fontWeights.semiBold, lineHeight: fontSizes['2xl'] * lh.tight },
  h4:       { fontFamily: fontFamily.semibold, fontSize: fontSizes.xl,    fontWeight: fontWeights.semiBold, lineHeight: fontSizes.xl   * lh.normal },
  bodyLg:   { fontFamily: fontFamily.regular,  fontSize: fontSizes.lg,    fontWeight: fontWeights.regular,  lineHeight: fontSizes.lg   * lh.normal },
  verse:    { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontSize: fontSizes.xl, fontWeight: fontWeights.regular, lineHeight: fontSizes.xl * lh.relaxed },
  body:     { fontFamily: fontFamily.regular,  fontSize: fontSizes.md,    fontWeight: fontWeights.regular,  lineHeight: fontSizes.md   * lh.normal },
  bodySm:   { fontFamily: fontFamily.regular,  fontSize: fontSizes.sm,    fontWeight: fontWeights.regular,  lineHeight: fontSizes.sm   * lh.normal },
  label:    { fontFamily: fontFamily.semibold, fontSize: fontSizes.sm,    fontWeight: fontWeights.medium,   lineHeight: fontSizes.sm   * lh.normal },
  caption:  { fontFamily: fontFamily.regular,  fontSize: fontSizes.xs,    fontWeight: fontWeights.regular,  lineHeight: fontSizes.xs   * lh.normal },
  button:   { fontFamily: fontFamily.semibold, fontSize: fontSizes.md,    fontWeight: fontWeights.semiBold, lineHeight: fontSizes.md   * lh.tight },
  buttonSm: { fontFamily: fontFamily.semibold, fontSize: fontSizes.sm,    fontWeight: fontWeights.semiBold, lineHeight: fontSizes.sm   * lh.tight },
} as const;

export type TextPreset = keyof typeof textPresets;
