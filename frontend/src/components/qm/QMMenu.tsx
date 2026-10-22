import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { AnimatedPressable, Typography } from '../ui';
import { ChevronRightIcon, type IconComponent } from '../icons';
import { useTheme, spacing, radius } from '../../theme';
import { qmRowEnter } from './QMListBits';

const ROW_H = 56;
const TILE = 34;
const TILE_RADIUS = 11;

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

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  label: { marginTop: spacing.s22, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  card: { borderRadius: radius.r20, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: ROW_H },
  tile: { width: TILE, height: TILE, borderRadius: TILE_RADIUS, alignItems: 'center', justifyContent: 'center' },
});
