/**
 * SVG icon set — hand-written `react-native-svg` components (no icon-font
 * library). One component per icon, uniform 24×24 viewBox, outline style with a
 * 1.8 stroke. Pass `color` from the theme (e.g. `color={colors.primary}`).
 *
 * Paths are the standard Lucide (ISC-licensed) outlines.
 */
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export type IconComponent = React.FC<IconProps>;

const DEFAULT_COLOR = '#000000';

/** Shared wrapper for stroke-based outline icons. */
function Outline({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

const stroke = (color: string, w: number) => ({
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const FlameIcon: IconComponent = ({ size = 24, color = DEFAULT_COLOR }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5"
    />
  </Svg>
);

export const BellIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...stroke(color, strokeWidth)} />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ArrowRightIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M5 12h14" {...stroke(color, strokeWidth)} />
    <Path d="m12 5 7 7-7 7" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ChevronRightIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m9 6 6 6-6 6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const BookIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...stroke(color, strokeWidth)} />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const PlayIcon: IconComponent = ({ size = 24, color = DEFAULT_COLOR }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M6 3.5v17a1 1 0 0 0 1.53.85l13.5-8.5a1 1 0 0 0 0-1.7L7.53 2.65A1 1 0 0 0 6 3.5Z" />
  </Svg>
);

export const PlusCircleIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="M12 8v8M8 12h8" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const LibraryIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m16 6 4 14" {...stroke(color, strokeWidth)} />
    <Path d="M12 6v14" {...stroke(color, strokeWidth)} />
    <Path d="M8 8v12" {...stroke(color, strokeWidth)} />
    <Path d="M4 4v16" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const MoreVerticalIcon: IconComponent = ({ size, color = DEFAULT_COLOR }) => (
  <Outline size={size}>
    <Circle cx={12} cy={5} r={1.6} fill={color} />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
    <Circle cx={12} cy={19} r={1.6} fill={color} />
  </Outline>
);

export const UsersIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke(color, strokeWidth)} />
    <Circle cx={9} cy={7} r={4} {...stroke(color, strokeWidth)} />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" {...stroke(color, strokeWidth)} />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CloudOfflineIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m2 2 20 20" {...stroke(color, strokeWidth)} />
    <Path d="M5.8 5.8A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.3-.2" {...stroke(color, strokeWidth)} />
    <Path d="M21.5 16.5A4.5 4.5 0 0 0 17.5 10h-1.8A7 7 0 0 0 10 5.1" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CheckCircleIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={9} {...stroke(color, strokeWidth)} />
    <Path d="m8 12 3 3 5-6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const SparklesIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path
      d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"
      {...stroke(color, strokeWidth)}
    />
    <Path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8L16.5 17.5l1.8-.7z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const FileTextIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" {...stroke(color, strokeWidth)} />
    <Path d="M14 2v6h6" {...stroke(color, strokeWidth)} />
    <Path d="M8 13h8M8 17h6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const FolderIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path
      d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
      {...stroke(color, strokeWidth)}
    />
  </Outline>
);

export const SearchIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={11} cy={11} r={7} {...stroke(color, strokeWidth)} />
    <Path d="m21 21-4.3-4.3" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const UserIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" {...stroke(color, strokeWidth)} />
    <Circle cx={12} cy={7} r={4} {...stroke(color, strokeWidth)} />
  </Outline>
);

export const HomeIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M3 10.2a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6a2 2 0 0 1 .7 1.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...stroke(color, strokeWidth)} />
    <Path d="M9 21v-7h6v7" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const StarIcon: IconComponent = ({ size = 24, color = DEFAULT_COLOR }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.4L12 16.9 5.9 20.3 7.4 13.9l-5-4.3 6.6-.6z" />
  </Svg>
);
