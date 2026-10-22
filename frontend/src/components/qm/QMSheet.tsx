import React, { useCallback, useEffect, useRef } from 'react';
import { BackHandler, Keyboard, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, Typography } from '../ui';
import { CheckIcon, type IconComponent } from '../icons';
import { useTheme, spacing, radius } from '../../theme';

const HANDLE_W = 38;
const HANDLE_H = 5;
const ROW_MIN_H = 54;
const ICON = 22;
const MAX_SHARE = 0.85; // sheet never taller than 85% of the screen

export interface QMSheetAction {
  label: string;
  icon: IconComponent;
  onPress?: () => void;
  sub?: string;
  /** Icon tint override (e.g. a folder's own colour). */
  iconColor?: string;
  danger?: boolean;
  /** Shown but not tappable (e.g. "Needs 4+ cards"). */
  off?: boolean;
  tick?: boolean;
  /** Lilac-filled row (e.g. Mix). */
  highlight?: boolean;
}

interface QMSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  sub?: string;
  actions?: QMSheetAction[];
  /** Muted note under the rows. */
  note?: string;
  /** Custom body (forms) rendered after the rows. */
  children?: React.ReactNode;
}

/**
 * Quiet-morning bottom sheet (canvas `k-sheet`): handle, serif title, icon rows.
 * A row's `onPress` runs after the sheet has finished closing, so it can safely
 * navigate or open another sheet.
 */
export function QMSheet({ visible, onClose, title, sub, actions, note, children }: QMSheetProps) {
  const { qm, name: themeName } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);
  const isOpen = useRef(false);
  const pending = useRef<(() => void) | null>(null);

  // isOpen guards against a double dismiss (swipe-close fires onDismiss before
  // visible flips), which breaks BottomSheetModal's later present() calls.
  const handleDismiss = useCallback(() => {
    isOpen.current = false;
    onClose();
    const fn = pending.current;
    pending.current = null;
    fn?.();
  }, [onClose]);

  useEffect(() => {
    if (visible && !isOpen.current) {
      isOpen.current = true;
      Keyboard.dismiss();
      ref.current?.present();
    } else if (!visible && isOpen.current) {
      ref.current?.dismiss();
    }
  }, [visible]);

  // Android back closes the sheet, not the screen behind it.
  useEffect(() => {
    if (!visible) return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => { ref.current?.dismiss(); return true; });
    return () => backSub.remove();
  }, [visible]);

  const run = useCallback((fn?: () => void) => {
    pending.current = fn ?? null;
    ref.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={themeName === 'dark' ? 0.55 : 0.35} />
    ),
    [themeName],
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={handleDismiss}
      maxDynamicContentSize={height * MAX_SHARE}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={[styles.handle, { backgroundColor: qm.line }]}
      backgroundStyle={[styles.bg, { backgroundColor: qm.sheet }]}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} keyboardShouldPersistTaps="handled">
        {title ? <Typography preset="qmSheetTitle" color={qm.ink} style={styles.title} numberOfLines={2}>{title}</Typography> : null}
        {sub ? <Typography preset="qmBody" color={qm.muted} style={styles.sub} numberOfLines={1}>{sub}</Typography> : null}
        <View style={styles.gap} />
        {actions?.map((a, i) => {
          const prev = actions[i - 1];
          const line = i > 0 && !a.highlight && !prev?.highlight;
          return <SheetRow key={a.label} action={a} line={line} onRun={run} />;
        })}
        {note ? <Typography preset="qmBody" color={qm.muted} style={styles.note}>{note}</Typography> : null}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function SheetRow({ action: a, line, onRun }: { action: QMSheetAction; line: boolean; onRun: (fn?: () => void) => void }) {
  const { qm } = useTheme();
  const ink = a.off ? qm.muted : a.danger ? qm.error : qm.ink;
  const iconInk = a.off ? qm.muted : a.danger ? qm.error : a.iconColor ?? qm.link;
  const Icon = a.icon;
  return (
    <AnimatedPressable
      scaleTo={0.97}
      disabled={a.off}
      onPress={() => onRun(a.onPress)}
      style={[
        styles.row,
        line && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair },
        a.highlight && { backgroundColor: qm.lilac, borderRadius: radius.r12 + 2 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!a.off, selected: !!a.tick }}
      accessibilityLabel={a.sub ? `${a.label}, ${a.sub}` : a.label}
    >
      <Icon size={ICON} color={iconInk} />
      <View style={styles.flex}>
        <Typography preset="qmRow" color={ink}>{a.label}</Typography>
        {a.sub ? <Typography preset="qmMeta" color={qm.muted} style={styles.rowSub}>{a.sub}</Typography> : null}
      </View>
      {a.tick && <CheckIcon size={20} color={qm.link} strokeWidth={2.4} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  bg: { borderTopLeftRadius: radius.r28, borderTopRightRadius: radius.r28 },
  handle: { width: HANDLE_W, height: HANDLE_H, borderRadius: radius.r3 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  title: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  sub: { paddingHorizontal: spacing.md, paddingTop: spacing.s2 },
  gap: { height: spacing.sm },
  row: {
    minHeight: ROW_MIN_H, paddingVertical: spacing.s6, paddingHorizontal: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.s14,
  },
  flex: { flex: 1, minWidth: 0 },
  rowSub: { marginTop: spacing.s2 },
  note: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
