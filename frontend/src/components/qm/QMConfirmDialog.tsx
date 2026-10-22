import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography } from '../ui';
import { useTheme, spacing, radius } from '../../theme';

const BTN_H = 52;

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Quiet-morning centred confirm (canvas `k-dlg`). Takes `useConfirmDialog().dialogProps`. */
export function QMConfirmDialog({
  visible, title, message, confirmLabel, cancelLabel, variant = 'default', loading = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const { qm } = useTheme();
  const danger = variant === 'danger';
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={[styles.scrim, { backgroundColor: qm.scrim }]} onPress={loading ? undefined : onCancel} accessibilityLabel={cancelLabel ?? t('actions.cancel')} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View entering={ZoomIn.duration(280).springify().damping(16)} style={[styles.card, { backgroundColor: qm.sheet }]} accessibilityRole="alert">
          <Typography preset="qmSheetTitle" color={qm.ink} align="center">{title}</Typography>
          <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.msg}>{message}</Typography>
          <View style={styles.btnRow}>
            <AnimatedPressable scaleTo={0.97} disabled={loading} onPress={onCancel} style={[styles.btn, { backgroundColor: qm.quiet }]} accessibilityRole="button">
              <Typography preset="qmButtonLg" color={qm.ink}>{cancelLabel ?? t('actions.cancel')}</Typography>
            </AnimatedPressable>
            <AnimatedPressable
              scaleTo={0.97}
              disabled={loading}
              onPress={onConfirm}
              style={[styles.btn, { backgroundColor: danger ? qm.error : qm.violet }]}
              accessibilityRole="button"
              accessibilityState={{ busy: loading }}
            >
              {loading
                ? <ActivityIndicator size="small" color={danger ? qm.onDanger : qm.onViolet} />
                : <Typography preset="qmButtonLg" color={danger ? qm.onDanger : qm.onViolet}>{confirmLabel ?? t('actions.confirm')}</Typography>}
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  center: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: spacing.xxxl },
  card: { borderRadius: radius.lg, paddingTop: spacing.xxl, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  msg: { marginTop: spacing.sm },
  btnRow: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.xl },
  btn: { flex: 1, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
