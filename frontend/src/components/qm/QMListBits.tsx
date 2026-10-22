import React, { forwardRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeInUp, SharedValue, runOnJS, useAnimatedReaction, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography } from '../ui';
import {
  CheckIcon, GlobeIcon, MoreHorizontalIcon, MoreVerticalIcon, PlusIcon, SearchIcon, SortIcon, type IconComponent,
} from '../icons';
import { useTheme, spacing, radius, textPresets, qmAccent } from '../../theme';

const TOUCH = 44;
const SEG_H = 40;
const SEG_PAD = 4;
const SEARCH_H = 46;
const SORT_H = 34;
const EMPTY_TILE = 84;
const EMPTY_BTN_H = 52;
const SET_TILE_W = 52;
const SET_TILE_H = 64;
const SET_STRIPE = 6;
const SWATCH_COLS = 7;
const SWATCH_GAP = 10;
const BAR_H = 52;
/** Canvas list entrance: fade-up 12px, 30ms stagger. */
export const qmRowEnter = (i: number) => FadeInUp.duration(320).delay(Math.min(i, 10) * 30);

// ─── Segmented control with sliding pill ─────────────────────────────────────
export function QMSegmented<K extends string>({ options, value, onChange, label }: {
  options: { key: K; label: string; icon?: IconComponent }[]; value: K; onChange: (k: K) => void; label: string;
}) {
  const { qm } = useTheme();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex(o => o.key === value));
  const segW = w ? (w - SEG_PAD * 2) / options.length : 0;
  const pill = useAnimatedStyle(() => ({
    width: segW,
    transform: [{ translateX: withSpring(idx * segW, { damping: 16, stiffness: 180 }) }],
  }), [idx, segW]);
  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[styles.seg, { backgroundColor: qm.field }]}
      accessibilityRole="tablist"
      accessibilityLabel={label}
    >
      {w > 0 && <Animated.View style={[styles.segPill, { backgroundColor: qm.pill, boxShadow: qm.pillShadow }, pill]} />}
      {options.map(o => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={styles.segBtn}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.key === value }}
        >
          {o.icon && <o.icon size={15} color={o.key === value ? qm.ink : qm.muted} strokeWidth={2.2} />}
          <Typography preset="qmSegment" color={o.key === value ? qm.ink : qm.muted}>{o.label}</Typography>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Search field ────────────────────────────────────────────────────────────
export const QMSearchField = forwardRef<TextInput, TextInputProps>(function QMSearchField({ style, placeholder, ...rest }, ref) {
  const { qm } = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: qm.field }]}>
      <SearchIcon size={18} color={qm.muted} strokeWidth={2} />
      <TextInput
        ref={ref}
        style={[styles.searchInput, { color: qm.ink }, style]}
        placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={qm.muted}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        {...rest}
      />
    </View>
  );
});

// ─── Empty / error state ─────────────────────────────────────────────────────
export function QMEmpty({ icon: Icon, title, text, action, style }: {
  icon: IconComponent; title: string; text?: string;
  action?: { label: string; onPress: () => void }; style?: object;
}) {
  const { qm } = useTheme();
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={[styles.empty, style]}>
      <View style={[styles.emptyTile, { backgroundColor: qm.lilac }]}>
        <Icon size={40} color={qm.link} strokeWidth={1.6} />
      </View>
      <Typography preset="qmEmptyTitle" color={qm.ink} align="center" style={styles.emptyTitle}>{title}</Typography>
      {text ? <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.emptyText}>{text}</Typography> : null}
      {action && (
        <AnimatedPressable
          scaleTo={0.97}
          onPress={action.onPress}
          style={[styles.emptyBtn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}
          accessibilityRole="button"
        >
          <Typography preset="qmButtonLg" color={qm.onViolet}>{action.label}</Typography>
        </AnimatedPressable>
      )}
    </Animated.View>
  );
}

// ─── Round violet "+" ────────────────────────────────────────────────────────
export function QMAddButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { qm } = useTheme();
  return (
    <AnimatedPressable
      scaleTo={0.92}
      onPress={onPress}
      style={[styles.add, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <PlusIcon size={20} color={qm.onViolet} />
    </AnimatedPressable>
  );
}

// ─── Sort chip ───────────────────────────────────────────────────────────────
export function QMSortChip({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTranslation('library');
  const { qm } = useTheme();
  return (
    <AnimatedPressable
      scaleTo={0.95}
      onPress={onPress}
      style={[styles.sort, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
      accessibilityRole="button"
      accessibilityLabel={t('qm.sortA11y', { label, defaultValue: `Sort: ${label}` })}
    >
      <SortIcon size={15} color={qm.ink} strokeWidth={2.2} />
      <Typography preset="qmChip" color={qm.ink}>{label}</Typography>
    </AnimatedPressable>
  );
}

// ─── Set row (tile with initial + title + meta + optional chip + ⋮) ─────────
export const QMSetRow = React.memo(function QMSetRow({ title, color, meta, chip, onPress, onMenu, menuLabel, trailing, right }: {
  title: string; color?: string | null; meta: string; chip?: string;
  onPress: () => void; onMenu?: () => void; menuLabel?: string; trailing?: React.ReactNode;
  /** Own control after the row's tap area (e.g. an Add button). */
  right?: React.ReactNode;
}) {
  const { qm, name } = useTheme();
  const [bg, ink] = qmAccent(qm, name === 'dark', color);
  return (
    <View style={[styles.setRow, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <AnimatedPressable scaleTo={0.98} onPress={onPress} style={styles.setMain} accessibilityRole="button" accessibilityLabel={title}>
        <View style={[styles.setTile, { backgroundColor: bg }]}>
          <View style={[styles.setStripe, { backgroundColor: ink }]} />
          <Typography preset="qmEmptyTitle" color={ink} style={styles.setInitial}>{title.trim().charAt(0).toUpperCase()}</Typography>
        </View>
        <View style={styles.flex}>
          <Typography preset="qmRowTitle" color={qm.ink} numberOfLines={1}>{title}</Typography>
          <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.setMeta}>{meta}</Typography>
          {chip ? (
            <View style={[styles.chip, { backgroundColor: qm.lilac }]}>
              <GlobeIcon size={12} color={qm.lilacInk} strokeWidth={2.2} />
              <Typography preset="qmChip" color={qm.lilacInk}>{chip}</Typography>
            </View>
          ) : null}
        </View>
        {trailing}
      </AnimatedPressable>
      {right}
      {onMenu && (
        <Pressable onPress={onMenu} hitSlop={4} style={({ pressed }) => [styles.menu, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={menuLabel}>
          <MoreVerticalIcon size={20} color={qm.muted} />
        </Pressable>
      )}
    </View>
  );
});

// ─── Folder tile (2-col grid) ────────────────────────────────────────────────
export const QMFolderTile = React.memo(function QMFolderTile({ name: folderName, color, meta, onPress, onMenu, menuLabel }: {
  name: string; color?: string | null; meta: string; onPress: () => void; onMenu: () => void; menuLabel: string;
}) {
  const { qm, name } = useTheme();
  const [bg, ink] = color ? qmAccent(qm, name === 'dark', color) : [qm.field, qm.muted];
  return (
    <View style={styles.flex}>
      <AnimatedPressable scaleTo={0.97} onPress={onPress} style={[styles.folder, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]} accessibilityRole="button" accessibilityLabel={folderName}>
        <Svg width={34} height={30} viewBox="0 0 34 30">
          <Path d="M2 6a4 4 0 0 1 4-4h7l4 4h11a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill={bg} stroke={ink} strokeWidth={1.6} />
        </Svg>
        <View>
          <Typography preset="qmRowTitle" color={qm.ink} numberOfLines={1}>{folderName}</Typography>
          <Typography preset="qmMeta" color={qm.muted} style={styles.folderMeta}>{meta}</Typography>
        </View>
      </AnimatedPressable>
      <Pressable onPress={onMenu} hitSlop={4} style={({ pressed }) => [styles.menu, styles.folderMenu, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={menuLabel}>
        <MoreHorizontalIcon size={20} color={qm.muted} />
      </Pressable>
    </View>
  );
});

// ─── Colour swatches ("No colour" + presets, 7 per row) ──────────────────────
export const PRESET_COLORS = [
  '#7C3AED', '#3B82F6', '#0D9488', '#16A34A',
  '#CA8A04', '#EA580C', '#DC2626', '#DB2777',
  '#4F46E5', '#0891B2', '#65A30D', '#E11D48',
] as const;

export function QMColorSwatches({ value, onChange, presets }: {
  value: string | null; onChange: (c: string | null) => void; presets: readonly string[];
}) {
  const { t } = useTranslation('library');
  const { qm } = useTheme();
  const [w, setW] = useState(0);
  const size = w ? Math.floor((w - SWATCH_GAP * (SWATCH_COLS - 1)) / SWATCH_COLS) : 0;
  return (
    <View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={styles.swatches}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('folders.color', 'Color')}
    >
      {size > 0 && [null, ...presets].map(c => {
        const on = c === value || (!c && !value);
        const shape = { width: size, height: size, borderRadius: size / 2 };
        return (
          <AnimatedPressable
            key={c ?? 'none'}
            scaleTo={0.88}
            onPress={() => onChange(c && c === value ? null : c)}
            style={[
              styles.swatch, shape,
              c
                ? { backgroundColor: c, boxShadow: on ? `0px 0px 0px 2px ${qm.sheet}, 0px 0px 0px 4px ${c}` : undefined }
                : { boxShadow: on ? `inset 0px 0px 0px 2px ${qm.ink}` : `inset 0px 0px 0px 1.5px ${qm.line}` },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={c ?? t('qm.noColor', 'No color')}
          >
            {c && on && <CheckIcon size={16} color={qm.onViolet} strokeWidth={3} />}
            {!c && (
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path d="M6 18L18 6" stroke={on ? qm.ink : qm.muted} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            )}
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

// ─── Sticky glass bar that fades in once the big title scrolls away ─────────
export function QMStickyBar({ title, scrollY, threshold = 56, right }: {
  title: string; scrollY: SharedValue<number>; threshold?: number; right?: React.ReactNode;
}) {
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  // Hidden bar must not swallow taps meant for the big header under it.
  const [shown, setShown] = useState(false);
  useAnimatedReaction(() => scrollY.value > threshold, (v, prev) => { if (v !== prev) runOnJS(setShown)(v); }, [threshold]);
  const anim = useAnimatedStyle(() => ({
    opacity: withTiming(scrollY.value > threshold ? 1 : 0, { duration: 200 }),
  }));
  return (
    <Animated.View
      pointerEvents={shown ? 'box-none' : 'none'}
      style={[styles.bar, { paddingTop: insets.top, height: insets.top + BAR_H, backgroundColor: qm.glass, borderBottomColor: qm.hair }, anim]}
    >
      <Typography preset="qmBarTitle" color={qm.ink} numberOfLines={1} style={styles.flex}>{title}</Typography>
      {right}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  seg: { flexDirection: 'row', padding: SEG_PAD, borderRadius: radius.r12 + 2 },
  segPill: { position: 'absolute', top: SEG_PAD, left: SEG_PAD, height: SEG_H, borderRadius: radius.r10 + 1 },
  segBtn: { flex: 1, height: SEG_H, flexDirection: 'row', gap: spacing.s6, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
    height: SEARCH_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, ...textPresets.qmInput, fontSize: 15 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.md },
  emptyTile: { width: EMPTY_TILE, height: EMPTY_TILE, borderRadius: radius.r28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: spacing.s18, marginBottom: spacing.sm },
  emptyText: { maxWidth: 300 },
  emptyBtn: {
    marginTop: spacing.s22, height: EMPTY_BTN_H, paddingHorizontal: spacing.s28,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
  },
  add: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  sort: {
    height: SORT_H, paddingHorizontal: spacing.md, borderRadius: radius.pill,
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
  },
  setRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    paddingVertical: spacing.md, paddingLeft: spacing.md, paddingRight: spacing.s6, borderRadius: radius.r20,
  },
  setMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s14 },
  setTile: {
    width: SET_TILE_W, height: SET_TILE_H, borderRadius: radius.r12, overflow: 'hidden',
    justifyContent: 'flex-end', padding: spacing.sm,
  },
  setStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: SET_STRIPE, opacity: 0.35 },
  setInitial: { lineHeight: 26 },
  setMeta: { marginTop: spacing.xs },
  chip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.s7, paddingVertical: spacing.s3, paddingHorizontal: spacing.sm, borderRadius: radius.pill,
  },
  menu: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  folder: { borderRadius: radius.r21 + 1, padding: spacing.lg, gap: spacing.s22 },
  folderMeta: { marginTop: spacing.s3 },
  folderMenu: { position: 'absolute', top: spacing.s6, right: spacing.xs },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: SWATCH_GAP },
  swatch: { alignItems: 'center', justifyContent: 'center' },
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
