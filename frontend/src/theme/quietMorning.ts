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
  /** White-on-violet pill (button cost badge). */
  badgeOnViolet: string;
  /** Brand tile (logo, splash) — identical in light and dark. */
  brand: string;
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
  /** Daily-verse card: soft 160° warm paper. */
  verse: readonly [string, string, string];
  verseInk: string;
  verseLabel: string;
  verseRef: string;
  verseBtn: string;
  verseShadow: string;
  /** Floating tab bar. */
  tabBg: string;
  tabShadow: string;
  tabIdle: string;
  tabOn: string;
  tabPill: string;
  /** Forms (auth + every later form). */
  line: string;
  focusRing: string;
  error: string;
  errorBg: string;
  /** Soft 'missed' ink on errorBg (quiz scores, missed answers). */
  warm: string;
  off: string;
  btnOff: string;
  btnOffInk: string;
  /** Brand-mandated social buttons (Apple HIG / Google identity guidelines). */
  appleBg: string;
  appleInk: string;
  googleBg: string;
  googleInk: string;
  googleLine: string;
  /** Onboarding scenes. */
  dot: string;
  fan1: string;
  fan3: string;
  liftShadow: string;
  /** Sheets, dialogs, segmented pill, sticky bars (Library module on). */
  sheet: string;
  scrim: string;
  quiet: string;
  onDanger: string;
  pill: string;
  pillShadow: string;
  glass: string;
  /** Quiz play (module 4): answer rows, feedback sheet, blank gaps. */
  optLine: string;
  okSheet: string;
  okInk: string;
  noSheet: string;
  noInk: string;
  ghost: string;
  blank: string;
  sheetShadow: string;
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
  badgeOnViolet: 'rgba(255,255,255,0.2)',
  brand: '#6D4AE0',
  hero: ['#EEE7FC', '#F3ECF8', '#FBF1EA'],
  fogLilac: ['#C4B2FA', 0.32],
  fogWarm: ['#FFCEAA', 0.26],
  cardShadow: '0px 1px 2px rgba(34,30,51,0.05), 0px 8px 24px -18px rgba(34,30,51,0.3)',
  btnShadow: '0px 8px 18px -8px rgba(109,74,224,0.8)',
  setColors,
  verse: ['#FCF6EE', '#FAF2EE', '#F6EFF8'],
  verseInk: '#2A2238',
  verseLabel: '#7A4E2A',
  verseRef: '#6D4AE0',
  verseBtn: 'rgba(255,255,255,0.72)',
  verseShadow: '0px 18px 40px -22px rgba(109,74,224,0.35)',
  tabBg: '#FFFFFF',
  tabShadow: '0px 10px 30px -12px rgba(34,30,51,0.28), 0px 0px 0px 1px rgba(34,30,51,0.04)',
  tabIdle: '#6B6580',
  tabOn: '#6D4AE0',
  tabPill: '#EEE9FB',
  line: 'rgba(34,30,51,0.13)',
  focusRing: '0px 0px 0px 4px rgba(124,92,240,0.18)',
  error: '#B4442F',
  errorBg: '#FBEDEA',
  warm: '#A4573F',
  off: '#B9B3C4',
  btnOff: '#D9D3E6',
  btnOffInk: '#7C7690',
  appleBg: '#000000',
  appleInk: '#FFFFFF',
  googleBg: '#FFFFFF',
  googleInk: '#1F1F1F',
  googleLine: '#747775',
  dot: '#D6CFE6',
  fan1: '#F6E3E1',
  fan3: '#E1EAF6',
  liftShadow: '0px 18px 40px -22px rgba(34,30,51,0.35)',
  sheet: '#FFFFFF',
  scrim: 'rgba(20,16,30,0.35)',
  quiet: '#F1EEF4',
  onDanger: '#FFFFFF',
  pill: '#FFFFFF',
  pillShadow: '0px 2px 8px rgba(34,30,51,0.1)',
  optLine: 'inset 0px 0px 0px 1px rgba(34,30,51,0.08), 0px 6px 18px -14px rgba(34,30,51,0.35)',
  okSheet: '#EEF5EF',
  okInk: '#3F6B4A',
  noSheet: '#FBF3EE',
  noInk: '#8A5A2E',
  ghost: 'rgba(255,255,255,0.8)',
  blank: '#C9C4D3',
  sheetShadow: '0px -12px 40px -20px rgba(34,30,51,0.35)',
  glass: '#FBF9F6', // ponytail: no blur lib → solid bar, add @react-native-community/blur for real glass
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
  badgeOnViolet: 'rgba(255,255,255,0.2)',
  brand: '#6D4AE0',
  hero: ['#2A2140', '#231C33', '#2A1F2E'],
  fogLilac: ['#7C5CF0', 0.16],
  fogWarm: ['#FF965A', 0.06],
  cardShadow: '0px 0px 0px 1px rgba(255,255,255,0.05)',
  btnShadow: '0px 8px 22px -10px rgba(124,92,240,0.7)',
  setColors,
  verse: ['#241D2C', '#211B2B', '#221C33'],
  verseInk: '#F4EDE6',
  verseLabel: '#E7B48A',
  verseRef: '#B3A0FA',
  verseBtn: 'rgba(255,255,255,0.09)',
  verseShadow: '0px 0px 0px 1px rgba(255,255,255,0.05)',
  tabBg: '#201B2A',
  tabShadow: '0px 12px 32px -12px rgba(0,0,0,0.6), 0px 0px 0px 1px rgba(255,255,255,0.08)',
  tabIdle: '#A69FB6',
  tabOn: '#C9BBFF',
  tabPill: '#2E2647',
  line: 'rgba(255,255,255,0.13)',
  focusRing: '0px 0px 0px 4px rgba(124,92,240,0.18)',
  error: '#F08C78',
  errorBg: '#33201D',
  warm: '#E7A08C',
  off: '#5C5468',
  btnOff: '#2A2535',
  btnOffInk: '#8A8398',
  appleBg: '#FFFFFF',
  appleInk: '#000000',
  googleBg: '#131314',
  googleInk: '#E3E3E3',
  googleLine: '#8E918F',
  dot: '#3A3348',
  fan1: '#3A2426',
  fan3: '#1E2A3D',
  liftShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)',
  sheet: '#221D2E',
  scrim: 'rgba(0,0,0,0.55)',
  quiet: 'rgba(255,255,255,0.09)',
  onDanger: '#221D2E',
  pill: '#2E2840',
  pillShadow: '0px 0px 0px 1px rgba(255,255,255,0.06)',
  glass: '#14111B',
  optLine: 'inset 0px 0px 0px 1px rgba(255,255,255,0.07)',
  okSheet: '#1B2820',
  okInk: '#9BCDA6',
  noSheet: '#2E2219',
  noInk: '#E7B48A',
  ghost: 'rgba(255,255,255,0.08)',
  blank: '#4A4358',
  sheetShadow: '0px -1px 0px rgba(255,255,255,0.06)',
};

/** Mix two #RRGGBB colours: `t` = share of `a` (canvas `color-mix(in srgb, a t%, b)`). */
export function mixHex(a: string, b: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map(i => Math.round(ch(a, i) * t + ch(b, i) * (1 - t)));
  return '#' + out.map(v => v.toString(16).padStart(2, '0')).join('');
}

/** User-picked accent → [tile bg, ink]. No colour → lilac/link (canvas `tint()`/`deep()`). */
export function qmAccent(qm: QMColors, dark: boolean, hex?: string | null): [string, string] {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return [qm.lilac, qm.link];
  return [mixHex(hex, qm.surface, 0.16), dark ? mixHex(hex, '#FFFFFF', 0.55) : hex];
}

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
  qmButtonLg:  { fontFamily: qmFont.semibold,    fontSize: 16, lineHeight: 20 },
  qmInput:     { fontFamily: qmFont.regular,     fontSize: 16 },
  qmLead:      { fontFamily: qmFont.regular,     fontSize: 16, lineHeight: 24 },
  qmFieldLabel:{ fontFamily: qmFont.semibold,    fontSize: 14, lineHeight: 18 },
  qmError:     { fontFamily: qmFont.medium,      fontSize: 13, lineHeight: 18 },
  qmFine:      { fontFamily: qmFont.regular,     fontSize: 12, lineHeight: 18 },
  qmMeta:      { fontFamily: qmFont.regular,     fontSize: 13, lineHeight: 18 },
  qmCaption:   { fontFamily: qmFont.medium,      fontSize: 12, lineHeight: 15 },
  qmTag:       { fontFamily: qmFont.bold,        fontSize: 11, lineHeight: 14 },
  qmTab:       { fontFamily: qmFont.medium,      fontSize: 11, lineHeight: 14 },
  qmTabOn:     { fontFamily: qmFont.bold,        fontSize: 11, lineHeight: 14 },
  qmPageTitle: { fontFamily: qmFont.serifDisplay, fontSize: 30, lineHeight: 35, letterSpacing: -0.3 },
  qmEmptyTitle:{ fontFamily: qmFont.serifMedium, fontSize: 23, lineHeight: 30 },
  qmSheetTitle:{ fontFamily: qmFont.serifMedium, fontSize: 20, lineHeight: 26 },
  qmBarTitle:  { fontFamily: qmFont.serifMedium, fontSize: 19, lineHeight: 24 },
  qmRowTitle:  { fontFamily: qmFont.serifMedium, fontSize: 17, lineHeight: 22 },
  qmRow:       { fontFamily: qmFont.medium,      fontSize: 16, lineHeight: 21 },
  qmSegment:   { fontFamily: qmFont.semibold,    fontSize: 15, lineHeight: 20 },
  qmBodyMd:    { fontFamily: qmFont.regular,     fontSize: 15, lineHeight: 22 },
  qmChip:      { fontFamily: qmFont.semibold,    fontSize: 12, lineHeight: 15 },
  // Quiz play
  qmPrompt:    { fontFamily: qmFont.serif,       fontSize: 24, lineHeight: 35 },
  qmPromptSm:  { fontFamily: qmFont.serif,       fontSize: 20, lineHeight: 29 },
  qmOption:    { fontFamily: qmFont.medium,      fontSize: 17, lineHeight: 25 },
  qmOptionSerif:{ fontFamily: qmFont.serifMedium, fontSize: 16, lineHeight: 23 },
  qmAnswer:    { fontFamily: qmFont.regular,     fontSize: 17, lineHeight: 25 },
  qmBlanks:    { fontFamily: qmFont.serif,       fontSize: 20, lineHeight: 36 },
  qmBlankWord: { fontFamily: qmFont.serif,       fontSize: 18, lineHeight: 24 },
  qmTile:      { fontFamily: qmFont.serif,       fontSize: 17, lineHeight: 24 },
  qmRead:      { fontFamily: qmFont.serif,       fontSize: 21, lineHeight: 34 },
} as const;
