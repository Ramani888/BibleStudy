import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { AnimatedPressable, Typography } from '../ui';
import { ChevronRightIcon, type IconComponent } from '../icons';
import { useTheme, palette, spacing, radius } from '../../theme';
import { qmRowEnter } from './QMListBits';

const ROW_H = 56;
const TILE = 34;
const TILE_RADIUS = 11;
const SW_W = 51;
const SW_H = 31;
const SW_PAD = 2;
const KNOB = SW_H - SW_PAD * 2;

/** Canvas grouped list: small caps label above one white card of rows. */
export function QMMenuGroup({ label, index = 0, style, children }: {
  label?: string; index?: number; style?: ViewStyle; children: React.ReactNode;
}) {
  const { qm } = useTheme();
  return (
    <View style={style}>
      {label ? <Typography preset="qmLabel" color={qm.muted} style={styles.label}>{label}</Typography> : null}
      <Animated.View entering={qmRowEnter(index)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        {children}
      </Animated.View>
    </View>
  );
}

/** One row: optional tinted icon tile, label, value, chevron. `first` drops the hairline. */
export function QMMenuRow({ label, value, icon: Icon, tint, onPress, first, danger, chevron = true }: {
  label: string; value?: string; icon?: IconComponent; tint?: [string, string];
  onPress: () => void; first?: boolean; danger?: boolean; chevron?: boolean;
}) {
  const { qm } = useTheme();
  const [tileBg, tileInk] = tint ?? [qm.lilac, qm.link];
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
    >
      {Icon && (
        <View style={[styles.tile, { backgroundColor: tileBg }]}>
          <Icon size={18} color={tileInk} strokeWidth={2} />
        </View>
      )}
      <Typography preset="qmRow" color={danger ? qm.error : qm.ink} style={styles.flex} numberOfLines={1}>{label}</Typography>
      {value ? <Typography preset="qmBody" color={qm.muted} numberOfLines={1}>{value}</Typography> : null}
      {chevron && <ChevronRightIcon size={16} color={qm.muted} strokeWidth={2} />}
    </AnimatedPressable>
  );
}

/** iOS-size switch: violet on, soft grey off, springy knob. */
export function QMSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { qm } = useTheme();
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? SW_W - KNOB - SW_PAD * 2 : 0, { duration: 200 }) }],
  }), [value]);
  const track = useAnimatedStyle(() => ({ backgroundColor: withTiming(value ? qm.violet : qm.off, { duration: 250 }) }), [value, qm]);
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={label}>
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

/** Label + muted hint + switch. Optional icon tile and gold tag (e.g. NEW). */
export function QMSwitchRow({ label, hint, value, onChange, first, tag, icon: Icon, tint }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void;
  first?: boolean; tag?: string; icon?: IconComponent; tint?: [string, string];
}) {
  const { qm } = useTheme();
  const [tileBg, tileInk] = tint ?? [qm.lilac, qm.link];
  return (
    <View style={[styles.swRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}>
      {Icon && (
        <View style={[styles.tile, { backgroundColor: tileBg }]}>
          <Icon size={18} color={tileInk} strokeWidth={2} />
        </View>
      )}
      <View style={styles.flex}>
        <View style={styles.swTitle}>
          <Typography preset="qmRow" color={qm.ink} style={styles.shrink}>{label}</Typography>
          {tag && (
            <View style={[styles.newTag, { backgroundColor: qm.goldBg }]}>
              <Typography preset="qmTag" color={qm.goldText}>{tag}</Typography>
            </View>
          )}
        </View>
        {hint ? <Typography preset="qmMeta" color={qm.muted} style={styles.hint}>{hint}</Typography> : null}
      </View>
      <QMSwitch value={value} onChange={onChange} label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  label: { marginTop: spacing.s22, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  card: { borderRadius: radius.r20, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: ROW_H },
  track: { width: SW_W, height: SW_H, borderRadius: SW_H / 2, padding: SW_PAD },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: palette.white, boxShadow: '0px 2px 6px rgba(0,0,0,0.2)' },
  swRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, paddingVertical: spacing.s14 },
  swTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  newTag: { borderRadius: radius.r6, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  hint: { marginTop: spacing.s3 },
  tile: { width: TILE, height: TILE, borderRadius: TILE_RADIUS, alignItems: 'center', justifyContent: 'center' },
});
