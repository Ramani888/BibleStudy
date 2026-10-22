import type { QMColors } from './quietMorning';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, textPresets } from './typography';
import { layout } from '../constants/layout';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  // BibleStudy extension — component layout constants not in Meditation theme
  textPresets: typeof textPresets;
  layout: typeof layout;
  /** Quiet-morning colours — the app's only colour set. */
  qm: QMColors;
}
