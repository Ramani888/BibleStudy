import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppModal } from './Modal';
import { Button, Divider, Typography } from '../ui';
import { colors, fontSizes, lineHeights, spacing } from '../../theme';

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

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AppModal
      visible={visible}
      animationType="fade"
      onClose={onCancel}
      wrapperStyle={styles.wrapper}
      contentStyle={styles.content}
    >
      <Typography preset="h4" style={styles.title}>{title}</Typography>
      <Typography preset="body" color={colors.textSecondary} style={styles.message}>
        {message}
      </Typography>
      <Divider />
      <View style={styles.btnRow}>
        <Button
          label={cancelLabel}
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          style={styles.btn}
        />
        <Button
          label={confirmLabel}
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onPress={onConfirm}
          loading={loading}
          style={styles.btn}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center' },
  content: {
    borderRadius: 20,
    marginHorizontal: spacing[6],
    paddingBottom: spacing[5],
  },
  title: { marginBottom: spacing[2] },
  message: { marginBottom: spacing[4], lineHeight: fontSizes.md * lineHeights.normal },
  btnRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[2] },
  btn: { flex: 1 },
});
