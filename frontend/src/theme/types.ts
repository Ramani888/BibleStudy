import { ThemeColors } from './colors';
import type { QMColors } from './quietMorning';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, textPresets } from './typography';
import { layout } from '../constants/layout';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  // BibleStudy extension — component layout constants not in Meditation theme
  textPresets: typeof textPresets;
  layout: typeof layout;
  /** Quiet-morning redesign colours — opt-in per module. */
  qm: QMColors;
}
