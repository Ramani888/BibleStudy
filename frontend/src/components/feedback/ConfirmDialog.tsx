import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppModal } from './Modal';
import { Button, Divider, Typography } from '../ui';
import { fontSizes, layout, lineHeights, spacing, useTheme } from '../../theme';

import { useTranslation } from 'react-i18next';

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
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const resolvedConfirm = confirmLabel ?? t('actions.confirm');
  const resolvedCancel = cancelLabel ?? t('actions.cancel');
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
          label={resolvedCancel}
          variant="ghost"
          onPress={onCancel}
          disabled={loading}
          style={styles.btn}
        />
        <Button
          label={resolvedConfirm}
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
    borderRadius: layout.cardRadiusSm,
    marginHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  title: { marginBottom: spacing.sm },
  message: { marginBottom: spacing.lg, lineHeight: fontSizes.md * lineHeights.normal },
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  btn: { flex: 1 },
});
