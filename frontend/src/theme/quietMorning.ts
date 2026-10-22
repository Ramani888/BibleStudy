/**
 * "Quiet morning" redesign tokens (canvas v93). Screens opt in one module at a
 * time via `useTheme().qm` + the `qm*` text presets; untouched screens keep the
 * legacy tokens. Fold into `colors.ts` once every module has moved over.
 */
export interface QMColors {
  bg: string;
  surface: string;
  ink: string;
  body: string;
  muted: string;
  violet: string;
  link: string;
  lilac: string;
  lilacInk: string;
  field: string;
  hair: string;
  gold: string;
  goldText: string;
  goldBg: string;
  leaf: string;
  leafBg: string;
  leafText: string;
  heroInk: string;
  heroMuted: string;
  onViolet: string;
  /** Soft 140° hero-card fog (violet → warm). */
  hero: readonly [string, string, string];
  /** Page-top fog [hex, opacity]: lilac top-left, warm top-right. (svg stops ignore rgba alpha) */
  fogLilac: readonly [string, number];
  fogWarm: readonly [string, number];
  /** RN `boxShadow` strings (light = soft drop, dark = hairline ring). */
  cardShadow: string;
  btnShadow: string;
  /** Recent-set colour bars, cycled by index. */
  setColors: readonly string[];
}

const setColors = ['#F2B8A0', '#B9A6F2', '#F0CF8E', '#A6C8EE', '#9FCBA8'] as const;

export const qmLight: QMColors = {
  bg: '#FBF9F6',
  surface: '#FFFFFF',
  ink: '#221E33',
  body: '#4A4458',
  muted: '#6B6580',
  violet: '#6D4AE0',
  link: '#6D4AE0',
  lilac: '#EEE9FB',
  lilacInk: '#5534C4',
  field: '#F1EEF4',
  hair: 'rgba(34,30,51,0.08)',
  gold: '#C9922F',
  goldText: '#8A6020',
  goldBg: '#FBF1DF',
  leaf: '#4F8A5B',
  leafBg: '#E6F1E7',
  leafText: '#3F6B4A',
  heroInk: '#3A2A4A',
  heroMuted: '#6E5A72',
  onViolet: '#FFFFFF',
  hero: ['#EEE7FC', '#F3ECF8', '#FBF1EA'],
  fogLilac: ['#C4B2FA', 0.32],
  fogWarm: ['#FFCEAA', 0.26],
  cardShadow: '0px 1px 2px rgba(34,30,51,0.05), 0px 8px 24px -18px rgba(34,30,51,0.3)',
  btnShadow: '0px 8px 18px -8px rgba(109,74,224,0.8)',
  setColors,
};

export const qmDark: QMColors = {
  bg: '#14111B',
  surface: '#1D1927',
  ink: '#F2EEF8',
  body: '#CFC8DC',
  muted: '#A69FB6',
  violet: '#7C5CF0',
  link: '#B3A0FA',
  lilac: '#2A2340',
  lilacInk: '#C9BBFF',
  field: '#241F2F',
  hair: 'rgba(255,255,255,0.08)',
  gold: '#D9A94E',
  goldText: '#E2B86A',
  goldBg: '#2E2416',
  leaf: '#7DB88A',
  leafBg: '#1E2C22',
  leafText: '#9BCDA6',
  heroInk: '#F4ECF6',
  heroMuted: '#C7B8CF',
  onViolet: '#FFFFFF',
  hero: ['#2A2140', '#231C33', '#2A1F2E'],
  fogLilac: ['#7C5CF0', 0.16],
  fogWarm: ['#FF965A', 0.06],
  cardShadow: '0px 0px 0px 1px rgba(255,255,255,0.05)',
  btnShadow: '0px 8px 22px -10px rgba(124,92,240,0.7)',
  setColors,
};

export const qmFont = {
  serif: 'Literata-Regular',
  serifMedium: 'Literata-Medium',
  /** 36pt optical size — finer strokes for big headings. File name = PostScript name (iOS + Android). */
  serifDisplay: 'Literata36pt-Medium',
  regular: 'Figtree-Regular',
  medium: 'Figtree-Medium',
  semibold: 'Figtree-SemiBold',
  bold: 'Figtree-Bold',
} as const;

/** Text presets — merged into `textPresets` so `<Typography preset="qm…">` works. */
export const qmPresets = {
  qmDisplay:   { fontFamily: qmFont.serifDisplay, fontSize: 32, lineHeight: 37, letterSpacing: -0.3 },
  qmTitle:     { fontFamily: qmFont.serifDisplay, fontSize: 24, lineHeight: 30 },
  qmCardTitle: { fontFamily: qmFont.serifMedium, fontSize: 16, lineHeight: 21 },
  qmVerse:     { fontFamily: qmFont.serif,       fontSize: 19, lineHeight: 28 },
  qmSection:   { fontFamily: qmFont.semibold,    fontSize: 17, lineHeight: 22 },
  qmBody:      { fontFamily: qmFont.regular,     fontSize: 14, lineHeight: 20 },
  qmBodyLg:    { fontFamily: qmFont.semibold,    fontSize: 16, lineHeight: 22 },
  qmLabel:     { fontFamily: qmFont.semibold,    fontSize: 13, lineHeight: 18, letterSpacing: 0.3 },
  qmLink:      { fontFamily: qmFont.semibold,    fontSize: 14, lineHeight: 20 },
  qmButton:    { fontFamily: qmFont.semibold,    fontSize: 15, lineHeight: 20 },
  qmMeta:      { fontFamily: qmFont.regular,     fontSize: 13, lineHeight: 18 },
  qmCaption:   { fontFamily: qmFont.medium,      fontSize: 12, lineHeight: 15 },
  qmTag:       { fontFamily: qmFont.bold,        fontSize: 11, lineHeight: 14 },
} as const;
