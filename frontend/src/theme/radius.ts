/**
 * Corner radii — copied from the Meditation project Figma components.
 * `sm…full` are canonical steps; `r<n>` are exact off-scale Figma values.
 */
export const radius = {
  // Canonical steps
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  pill: 999,
  full: 9999,

  // Figma-exact off-scale values
  r2:  2,
  r3:  3,
  r5:  5,
  r6:  6,
  r10: 10,
  r12: 12,
  r17: 17,
  r18: 18,
  r20: 20,
  r21: 21,
  r28: 28,
  r45: 45,
} as const;

export type Radius = typeof radius;
