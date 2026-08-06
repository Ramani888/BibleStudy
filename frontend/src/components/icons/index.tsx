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

export const BackIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M19 12H5M12 19l-7-7 7-7" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CloseIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M18 6 6 18M6 6l12 12" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const HelpCircleIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" {...stroke(color, strokeWidth)} />
    <Path d="M12 17h.01" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const PencilIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12 20h9" {...stroke(color, strokeWidth)} />
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CopyIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1Z" {...stroke(color, strokeWidth)} />
    <Path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ReorderIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M4 7h16M4 12h16M4 17h16" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ListIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M8 6h13M8 12h13M8 18h13" {...stroke(color, strokeWidth)} />
    <Path d="M3 6h.01M3 12h.01M3 18h.01" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const GridIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M4 4h7v7H4zM13 4h7v7h-7zM13 13h7v7h-7zM4 13h7v7H4z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const GlobeIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="M2 12h20" {...stroke(color, strokeWidth)} />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const TrashIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" {...stroke(color, strokeWidth)} />
    <Path d="M10 11v6M14 11v6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ShareIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={18} cy={5} r={3} {...stroke(color, strokeWidth)} />
    <Circle cx={6} cy={12} r={3} {...stroke(color, strokeWidth)} />
    <Circle cx={18} cy={19} r={3} {...stroke(color, strokeWidth)} />
    <Path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const InfoIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="M12 16v-4M12 8h.01" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ChevronDownIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m6 9 6 6 6-6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ChevronUpIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m18 15-6-6-6 6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const EyeIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" {...stroke(color, strokeWidth)} />
    <Circle cx={12} cy={12} r={3} {...stroke(color, strokeWidth)} />
  </Outline>
);

export const EyeOffIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m2 2 20 20" {...stroke(color, strokeWidth)} />
    <Path d="M6.7 6.7C4 8.4 2 12 2 12s3.5 7 10 7c2 0 3.7-.6 5.1-1.5" {...stroke(color, strokeWidth)} />
    <Path d="M9.9 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.4 3.2" {...stroke(color, strokeWidth)} />
    <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const SortIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M7 4v16M4 17l3 3 3-3" {...stroke(color, strokeWidth)} />
    <Path d="M17 20V4M14 7l3-3 3 3" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const StarIcon: IconComponent = ({ size = 24, color = DEFAULT_COLOR }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.4L12 16.9 5.9 20.3 7.4 13.9l-5-4.3 6.6-.6z" />
  </Svg>
);

export const StarOutlineIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12 2.5l2.9 6 6.6.6-5 4.3 1.5 6.4L12 16.9 5.9 20.3 7.4 13.9l-5-4.3 6.6-.6z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ClockIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="M12 6v6l4 2" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ChatIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ArrowUpIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12 19V5M5 12l7-7 7 7" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const AlbumsIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" {...stroke(color, strokeWidth)} />
    <Path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" {...stroke(color, strokeWidth)} />
    <Path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CloseCircleIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="m15 9-6 6M9 9l6 6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const RefreshIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M3 12a9 9 0 0 1 15-6.7L21 8" {...stroke(color, strokeWidth)} />
    <Path d="M21 3v5h-5" {...stroke(color, strokeWidth)} />
    <Path d="M21 12a9 9 0 0 1-15 6.7L3 16" {...stroke(color, strokeWidth)} />
    <Path d="M3 21v-5h5" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const BookmarkIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const TagIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.4 8.4a2 2 0 0 0 2.8 0l6.4-6.4a2 2 0 0 0 0-2.8Z" {...stroke(color, strokeWidth)} />
    <Path d="M7 7h.01" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const PlusIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12 5v14M5 12h14" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const BuildingIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M3 21h18" {...stroke(color, strokeWidth)} />
    <Path d="M5 21V7l8-4v18" {...stroke(color, strokeWidth)} />
    <Path d="M19 21V11l-6-4" {...stroke(color, strokeWidth)} />
    <Path d="M9 9h.01M9 13h.01M9 17h.01M13 13h.01M13 17h.01" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CalendarIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M8 2v4M16 2v4" {...stroke(color, strokeWidth)} />
    <Path d="M3 10h18" {...stroke(color, strokeWidth)} />
    <Path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CompassIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Circle cx={12} cy={12} r={10} {...stroke(color, strokeWidth)} />
    <Path d="m16.2 7.8-2 6.3-6.4 2 2-6.3z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const LogOutIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...stroke(color, strokeWidth)} />
    <Path d="m16 17 5-5-5-5" {...stroke(color, strokeWidth)} />
    <Path d="M21 12H9" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const LinkIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...stroke(color, strokeWidth)} />
    <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const UserPlusIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke(color, strokeWidth)} />
    <Circle cx={9} cy={7} r={4} {...stroke(color, strokeWidth)} />
    <Path d="M19 8v6M16 11h6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const UserMinusIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke(color, strokeWidth)} />
    <Circle cx={9} cy={7} r={4} {...stroke(color, strokeWidth)} />
    <Path d="M22 11h-6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const SwapIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M7 16V4M4 7l3-3 3 3" {...stroke(color, strokeWidth)} />
    <Path d="M17 8v12M14 17l3 3 3-3" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const LockIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z" {...stroke(color, strokeWidth)} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const SettingsIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" {...stroke(color, strokeWidth)} />
    <Circle cx={12} cy={12} r={3} {...stroke(color, strokeWidth)} />
  </Outline>
);

export const BarChartIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M3 3v18h18" {...stroke(color, strokeWidth)} />
    <Path d="M7 16v-5M12 16V8M17 16v-3" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const TrendingUpIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="m22 7-8.5 8.5-5-5L2 17" {...stroke(color, strokeWidth)} />
    <Path d="M16 7h6v6" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const PieChartIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" {...stroke(color, strokeWidth)} />
    <Path d="M22 12A10 10 0 0 0 12 2v10z" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ExpandIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const CameraIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" {...stroke(color, strokeWidth)} />
    <Circle cx={12} cy={13} r={3} {...stroke(color, strokeWidth)} />
  </Outline>
);

export const ShuffleIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" {...stroke(color, strokeWidth)} />
  </Outline>
);

export const TrophyIcon: IconComponent = ({ size, color = DEFAULT_COLOR, strokeWidth = 1.8 }) => (
  <Outline size={size}>
    <Path d="M7 3h10l2 6a6 6 0 01-12 0L7 3zM12 15v4M8 19h8M6 6H4c0 4 3 6 5 7M18 6h2c0 4-3 6-5 7" {...stroke(color, strokeWidth)} />
  </Outline>
);
