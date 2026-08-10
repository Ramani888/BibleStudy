/**
 * Raw brand palette — extracted verbatim from the Figma "Design System → Colors"
 * page of "MVP Meditation Timer App". These are the source-of-truth hex values;
 * semantic theme colors in `colors.ts` reference them.
 */
export const palette = {
  // Indigo
  indigo100: '#D8E0FF',
  indigo200: '#C0C1FF',
  indigo300: '#97A0FF',
  indigo500: '#6366F1',
  indigo600: '#5D03FF',
  indigo800: '#30208F',

  // Violet / light purple
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet700: '#7455FD',

  // Neutrals
  black:    '#030303',
  ink900:   '#0F1117',
  ink800:   '#1E2230',
  ink700:   '#24262B',
  slate600: '#393F53',
  slate500: '#475569',
  slate200: '#E2E8F0',
  grey300:  '#D6D6D6',
  grey100:  '#F5F5F5',
  white:    '#FFFFFF',

  // Gray scale (BibleStudy extension — for surface/text tokens)
  gray50:  '#F9F9F9',
  gray100: '#F5F5F5',
  gray200: '#E6E6E6',
  gray300: '#D6D6D6',
  gray400: '#AAAAAA',
  gray500: '#888888',
  gray600: '#666666',
  gray700: '#444444',
  gray800: '#2A2A2A',
  gray900: '#1A1A1A',

  // Status
  alert:        '#F0330D',
  warning:      '#FBA94C',
  success:      '#16972E',
  successBright: '#22C55E',

  // Status surfaces (BibleStudy extension)
  blue500:  '#3B82F6',
  blue100:  '#DBEAFE',
  green500: '#16972E',
  green100: '#D6F0D9',
  red100:   '#FEE2E2',
  yellow100: '#FEF3E2',
} as const;

export type Palette = typeof palette;

/** Light-mode frosted lavender card fill, shared across feature cards. */
export const CARD_FILL_LIGHT = '#F3EFFF';
