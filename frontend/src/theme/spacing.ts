/**
 * 4px base grid spacing system.
 * Use these tokens everywhere — no raw number margins/paddings.
 */
export const spacing = {
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Common layout values */
export const layout = {
  screenPaddingH: spacing[4],
  screenPaddingV: spacing[6],
  cardPadding: spacing[4],
  cardRadius: 16,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSm: 40,
  tabBarHeight: 64,
  headerHeight: 56,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 80,
} as const;
