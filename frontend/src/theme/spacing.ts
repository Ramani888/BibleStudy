/**
 * Spacing scale — copied from the Meditation project.
 * Named keys (xs…huge) are the canonical 4pt scale.
 * s<n> keys are Figma-exact off-grid values.
 */
export const spacing = {
  none: 0,

  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 40,

  s2:  2,
  s3:  3,
  s5:  5,
  s6:  6,
  s7:  7,
  s10: 10,
  s13: 13,
  s14: 14,
  s17: 17,
  s18: 18,
  s22: 22,
  s28: 28,
  s30: 30,
  s38: 38,
  s48: 48,
  s70: 70,
  s80: 80,
} as const;

export type SpacingKey = keyof typeof spacing;
