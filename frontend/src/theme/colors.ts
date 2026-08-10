import { palette } from './palette';

/**
 * Semantic color contract — Meditation theme (exact) + BibleStudy extensions.
 * No aliases, no duplicates. Use `useTheme()` to read tokens.
 */
export interface ThemeColors {
  // ── Meditation tokens (exact) ────────────────────────────────────────────────
  background: string;
  surface: string;
  surfaceMuted: string;
  chipIdle: string;
  chipNeutral: string;
  bottomBar: string;

  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  icon: string;
  tabInactive: string;
  tabActive: string;

  timerText: string;
  timerLabel: string;
  ringTrack: string;
  ringProgress: string;

  accent: string;
  accentSoft: string;
  border: string;
  cardBorder: string;
  divider: string;
  overlay: string;

  success: string;
  successSoft: string;
  alert: string;

  gradientStart: string;
  gradientEnd: string;

  surfaceTint: string;
  pillMuted: string;
  badgeLockedBg: string;

  sliderSurface: string;
  sliderTrack: string;
  sliderFill: string;
  sliderThumb: string;

  transparent: string;
  statusBar: 'light-content' | 'dark-content';

  // ── BibleStudy extensions (no Meditation equivalent) ─────────────────────────
  textDisabled: string;
  textOnPrimaryMuted: string;
  backgroundOverlay: string;
  overlayLight: string;

  errorSurface: string;
  warning: string;
  warningSurface: string;
  info: string;
  infoSurface: string;

  featuredSurface: string;

  gray100: string;
  gray200: string;
  gray300: string;
  gray500: string;
  gray700: string;

  difficultyEasy: string;
  difficultyEasySurface: string;
  difficultyMedium: string;
  difficultyMediumSurface: string;
  difficultyHard: string;
  difficultyHardSurface: string;
}

export const lightColors: ThemeColors = {
  // ── Meditation ────────────────────────────────────────────────────────────────
  background:  '#FCF8FF',
  surface:     palette.white,
  surfaceMuted: palette.grey100,
  chipIdle:    '#F3EFFF',
  chipNeutral: '#EBEBEB',
  bottomBar:   palette.white,

  textPrimary:   palette.black,
  textSecondary: palette.slate500,
  textOnAccent:  palette.white,
  icon:          '#130F26',
  tabInactive:   '#716F7D',
  tabActive:     palette.indigo500,

  timerText:    palette.indigo500,
  timerLabel:   palette.slate500,
  ringTrack:    palette.slate200,
  ringProgress: palette.indigo500,

  accent:     palette.indigo500,
  accentSoft: '#EEF0FF',
  border:     palette.slate200,
  cardBorder: palette.indigo200,
  divider:    '#EDEDED',
  overlay:    'rgba(3, 3, 3, 0.45)',

  success:     palette.success,
  successSoft: palette.green100,
  alert:       palette.alert,

  gradientStart: palette.violet500,
  gradientEnd:   palette.indigo500,

  surfaceTint:   '#F3EFFF',
  pillMuted:     '#F3EFFF',
  badgeLockedBg: '#EBEBEB',

  sliderSurface: palette.grey100,
  sliderTrack:   '#C0C1FF',
  sliderFill:    palette.indigo500,
  sliderThumb:   palette.indigo500,

  transparent: 'transparent',
  statusBar:   'dark-content',

  // ── BibleStudy extensions ────────────────────────────────────────────────────
  textDisabled:       palette.gray400,
  textOnPrimaryMuted: 'rgba(255, 255, 255, 0.65)',
  backgroundOverlay:  'rgba(255, 255, 255, 0.9)',
  overlayLight:       'rgba(255, 255, 255, 0.15)',

  errorSurface:   palette.red100,
  warning:        palette.warning,
  warningSurface: palette.yellow100,
  info:           palette.blue500,
  infoSurface:    palette.blue100,

  featuredSurface: palette.ink900,

  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray500: palette.gray500,
  gray700: palette.gray700,

  difficultyEasy:          palette.success,
  difficultyEasySurface:   palette.green100,
  difficultyMedium:        palette.warning,
  difficultyMediumSurface: palette.yellow100,
  difficultyHard:          palette.alert,
  difficultyHardSurface:   palette.red100,
};

export const darkColors: ThemeColors = {
  // ── Meditation ────────────────────────────────────────────────────────────────
  background:  palette.ink900,
  surface:     palette.ink800,
  surfaceMuted: palette.ink700,
  chipIdle:    '#171A23',
  chipNeutral: '#171A23',
  bottomBar:   '#171A23',

  textPrimary:   palette.white,
  textSecondary: '#B6BAC4',
  textOnAccent:  palette.white,
  icon:          palette.white,
  tabInactive:   'rgba(255, 255, 255, 0.6)',
  tabActive:     palette.indigo500,

  timerText:    palette.violet400,
  timerLabel:   palette.white,
  ringTrack:    palette.slate600,
  ringProgress: palette.violet400,

  accent:     palette.violet400,
  accentSoft: '#2A2342',
  border:     palette.slate600,
  cardBorder: 'rgba(192, 193, 255, 0.3)',
  divider:    palette.ink700,
  overlay:    'rgba(0, 0, 0, 0.6)',

  success:     palette.successBright,
  successSoft: '#173B25',
  alert:       palette.alert,

  gradientStart: palette.violet500,
  gradientEnd:   palette.indigo500,

  surfaceTint:   'rgba(243, 239, 255, 0.1)',
  pillMuted:     'rgba(255, 255, 255, 0.15)',
  badgeLockedBg: '#030303',

  sliderSurface: palette.ink800,
  sliderTrack:   palette.slate600,
  sliderFill:    palette.indigo500,
  sliderThumb:   palette.indigo500,

  transparent: 'transparent',
  statusBar:   'light-content',

  // ── BibleStudy extensions ────────────────────────────────────────────────────
  textDisabled:       palette.slate600,
  textOnPrimaryMuted: 'rgba(255, 255, 255, 0.65)',
  backgroundOverlay:  'rgba(0, 0, 0, 0.85)',
  overlayLight:       'rgba(255, 255, 255, 0.15)',

  errorSurface:   '#3B1512',
  warning:        palette.warning,
  warningSurface: '#3B2E17',
  info:           palette.blue500,
  infoSurface:    '#16233B',

  featuredSurface: palette.ink800,

  gray100: palette.gray100,
  gray200: palette.gray200,
  gray300: palette.gray300,
  gray500: palette.gray500,
  gray700: palette.gray700,

  difficultyEasy:          palette.successBright,
  difficultyEasySurface:   '#173B25',
  difficultyMedium:        palette.warning,
  difficultyMediumSurface: '#3B2E17',
  difficultyHard:          palette.alert,
  difficultyHardSurface:   '#3B1512',
};

/** Static light theme — for files not yet using useTheme(). */
export const colors = lightColors;

export type Colors = typeof colors;
