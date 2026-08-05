/**
 * Color palette and semantic tokens for BibleStudyPro.
 *
 * Migrated to the "meditation" indigo/violet design language, now with
 * **light + dark** themes. Read colors via `useTheme()` (see ./useTheme) so a
 * screen responds to dark mode. The static `colors` export below equals the
 * LIGHT theme and stays for screens not yet migrated to the hook — so the whole
 * app re-skins immediately, and dark mode lights up module-by-module.
 *
 * Both theme objects share the exact same keys (the `ThemeColors` contract) so
 * swapping light↔dark is a single object swap.
 */

const palette = {
  // Indigo (brand) — from the meditation Figma design system
  indigo100: '#D8E0FF',
  indigo200: '#C0C1FF',
  indigo300: '#97A0FF',
  indigo500: '#6366F1', // primary brand
  indigo600: '#5D03FF',
  indigo800: '#30208F',

  // Violet / light purple (dark-mode accent + gradients)
  violet400: '#A78BFA',
  violet500: '#8B5CF6',
  violet700: '#7455FD',

  // Neutrals
  white: '#FFFFFF',
  black: '#030303',
  ink900: '#0F1117',
  ink800: '#1E2230',
  ink700: '#24262B',
  slate600: '#393F53',
  slate500: '#475569',
  slate200: '#E2E8F0',
  gray50: '#F9F9F9',
  gray100: '#F5F5F5',
  gray200: '#E6E6E6',
  gray300: '#D6D6D6',
  gray400: '#AAAAAA',
  gray500: '#888888',
  gray600: '#666666',
  gray700: '#444444',
  gray800: '#2A2A2A',
  gray900: '#1A1A1A',

  // Semantic status — kept meaningful and independent of the indigo brand
  blue500: '#3B82F6',
  blue100: '#DBEAFE',
  green500: '#16972E',
  green100: '#D6F0D9',
  greenBright: '#22C55E',
  red500: '#F0330D',
  red100: '#FEE2E2',
  yellow500: '#FBA94C',
  yellow100: '#FEF3E2',
} as const;

/** The shared semantic contract. Light and dark both satisfy this shape. */
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primarySurface: string;

  background: string;
  backgroundSecondary: string;
  backgroundCard: string;

  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  textOnPrimary: string;

  border: string;
  borderFocus: string;

  error: string;
  errorSurface: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  info: string;
  infoSurface: string;

  difficultyEasy: string;
  difficultyEasySurface: string;
  difficultyMedium: string;
  difficultyMediumSurface: string;
  difficultyHard: string;
  difficultyHardSurface: string;

  gray100: string;
  gray200: string;
  gray300: string;
  gray500: string;
  gray700: string;

  overlay: string;
  backgroundOverlay: string;
  /** Subtle translucent-white overlay for elements sitting on dark surfaces
   *  (e.g. progress tracks/dividers on the featured card). */
  overlayLight: string;
  textOnPrimaryMuted: string;
  shadow: string;
  transparent: string;

  /** Bold dark "featured" card surface (near-black in light, raised in dark). */
  featuredSurface: string;

  /** Hero / accent gradient endpoints (e.g. the verse-of-the-day card). */
  gradientStart: string;
  gradientEnd: string;

  /** Raw palette for one-off use. */
  palette: typeof palette;

  /** Status-bar content style for this theme. */
  statusBar: 'light-content' | 'dark-content';
}

export const lightColors: ThemeColors = {
  primary: palette.indigo500,
  primaryLight: palette.indigo300,
  primaryDark: palette.indigo800,
  primarySurface: '#EEF0FF',

  background: '#FCF8FF',
  backgroundSecondary: palette.gray100,
  backgroundCard: palette.white,

  textPrimary: palette.black,
  textSecondary: palette.slate500,
  textDisabled: palette.gray400,
  textInverse: palette.white,
  textOnPrimary: palette.white,

  border: palette.slate200,
  borderFocus: palette.indigo500,

  error: palette.red500,
  errorSurface: palette.red100,
  success: palette.green500,
  successSurface: palette.green100,
  warning: palette.yellow500,
  warningSurface: palette.yellow100,
  info: palette.blue500,
  infoSurface: palette.blue100,

  difficultyEasy: palette.green500,
  difficultyEasySurface: palette.green100,
  difficultyMedium: palette.yellow500,
  difficultyMediumSurface: palette.yellow100,
  difficultyHard: palette.red500,
  difficultyHardSurface: palette.red100,

  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray500: palette.gray500,
  gray700: palette.gray700,

  overlay: 'rgba(3, 3, 3, 0.45)',
  backgroundOverlay: 'rgba(255, 255, 255, 0.9)',
  overlayLight: 'rgba(255, 255, 255, 0.15)',
  textOnPrimaryMuted: 'rgba(255, 255, 255, 0.65)',
  shadow: '#000000',
  transparent: 'transparent',

  featuredSurface: palette.ink900,

  gradientStart: palette.violet500,
  gradientEnd: palette.indigo500,

  palette,
  statusBar: 'dark-content',
};

export const darkColors: ThemeColors = {
  primary: palette.violet400,
  primaryLight: palette.indigo300,
  primaryDark: palette.indigo500,
  primarySurface: '#2A2342',

  background: palette.ink900,
  backgroundSecondary: palette.ink700,
  backgroundCard: palette.ink800,

  textPrimary: palette.white,
  textSecondary: '#B6BAC4',
  textDisabled: palette.slate600,
  textInverse: palette.gray900,
  textOnPrimary: palette.white,

  border: palette.slate600,
  borderFocus: palette.violet400,

  error: palette.red500,
  errorSurface: '#3B1512',
  success: palette.greenBright,
  successSurface: '#173B25',
  warning: palette.yellow500,
  warningSurface: '#3B2E17',
  info: palette.blue500,
  infoSurface: '#16233B',

  difficultyEasy: palette.greenBright,
  difficultyEasySurface: '#173B25',
  difficultyMedium: palette.yellow500,
  difficultyMediumSurface: '#3B2E17',
  difficultyHard: palette.red500,
  difficultyHardSurface: '#3B1512',

  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray500: palette.gray500,
  gray700: palette.gray700,

  overlay: 'rgba(0, 0, 0, 0.6)',
  backgroundOverlay: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.15)',
  textOnPrimaryMuted: 'rgba(255, 255, 255, 0.65)',
  shadow: '#000000',
  transparent: 'transparent',

  featuredSurface: palette.ink800,

  gradientStart: palette.violet500,
  gradientEnd: palette.indigo500,

  palette,
  statusBar: 'light-content',
};

/**
 * Static export = the LIGHT theme. Kept so every screen that still does
 * `import { colors } from '../theme'` keeps compiling and re-skins to indigo.
 * Migrate a screen to `useTheme()` to make it dark-mode aware.
 */
export const colors = lightColors;

export type Colors = typeof colors;
