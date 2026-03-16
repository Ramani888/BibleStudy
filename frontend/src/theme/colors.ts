/**
 * Color palette and semantic tokens for BibleStudyPro.
 * All colors in the app must come from here — no hex codes elsewhere.
 */

const palette = {
  // Brand
  gold50: '#FDF8EC',
  gold100: '#FAF0D0',
  gold200: '#F4DFA0',
  gold300: '#EEC96A',
  gold400: '#E6B230',
  gold500: '#D4990E', // primary brand
  gold600: '#A87608',
  gold700: '#7D5606',
  gold800: '#523807',
  gold900: '#291C03',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F9F9F9',
  gray100: '#F3F3F3',
  gray200: '#E6E6E6',
  gray300: '#CCCCCC',
  gray400: '#AAAAAA',
  gray500: '#888888',
  gray600: '#666666',
  gray700: '#444444',
  gray800: '#2A2A2A',
  gray900: '#1A1A1A',
  black: '#0D0D0D',

  // Semantic
  blue500: '#3B82F6',
  blue100: '#DBEAFE',
  green500: '#22C55E',
  green100: '#DCFCE7',
  red500: '#EF4444',
  red100: '#FEE2E2',
  yellow500: '#EAB308',
  yellow100: '#FEF9C3',
  purple500: '#A855F7',
  purple100: '#F3E8FF',
} as const;

export const colors = {
  // Primary
  primary: palette.gold500,
  primaryLight: palette.gold300,
  primaryDark: palette.gold700,
  primarySurface: palette.gold50,

  // Background
  background: palette.white,
  backgroundSecondary: palette.gray50,
  backgroundCard: palette.white,

  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textDisabled: palette.gray400,
  textInverse: palette.white,
  textOnPrimary: palette.white,

  // Border
  border: palette.gray200,
  borderFocus: palette.gold500,

  // States
  error: palette.red500,
  errorSurface: palette.red100,
  success: palette.green500,
  successSurface: palette.green100,
  warning: palette.yellow500,
  warningSurface: palette.yellow100,
  info: palette.blue500,
  infoSurface: palette.blue100,

  // Difficulty
  difficultyEasy: palette.green500,
  difficultyEasySurface: palette.green100,
  difficultyMedium: palette.yellow500,
  difficultyMediumSurface: palette.yellow100,
  difficultyHard: palette.red500,
  difficultyHardSurface: palette.red100,

  // Grays (commonly needed without going through palette)
  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray500: palette.gray500,
  gray700: palette.gray700,

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',

  // Expose palette for one-off use
  palette,
} as const;

export type Colors = typeof colors;
