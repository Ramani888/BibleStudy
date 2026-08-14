import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';

/** BibleStudy component layout constants. Not part of the theme token system. */
export const layout = {
  screenPaddingH:   spacing.lg,
  screenPaddingV:   spacing.xxl,
  cardPadding:      spacing.lg,
  cardRadius:       radius.r12,
  cardRadiusSm:     14,
  cardRadiusLg:     radius.md,
  pillRadius:       radius.pill,
  inputHeight:      52,
  buttonHeight:     52,
  buttonHeightSm:   40,
  tabBarHeight:        64,
  floatingTabBarHeight: 80, // pill content height (excl. safe area bottom inset)
  headerHeight:     56,
  avatarSm:         32,
  avatarMd:         48,
  avatarLg:         80,
  iconCircleLg:     52,
  progressBarHeight: 4,
} as const;
