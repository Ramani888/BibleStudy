import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Divider, Typography } from '../ui';
import type { IconComponent } from '../icons';
import { layout, spacing, useTheme } from '../../theme';

const ACTION_ICON_SIZE = 20;

export interface Action {
  label: string;
  /** SVG icon component (preferred). Falls back to `iconName` if omitted. */
  icon?: IconComponent;
  /** @deprecated Ionicons name — kept for callers not yet migrated to SVG. */
  iconName?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  actions: Action[];
  onClose: () => void;
}

import { useTranslation } from 'react-i18next';

export function ActionSheet({ visible, title, actions, onClose }: ActionSheetProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const ref = useRef<BottomSheetModal>(null);
  const isOpenRef = useRef(false);

  // Track open state separately to avoid calling dismiss() when the sheet is
  // already closed (user swipe / backdrop tap sets isOpenRef=false before the
  // visible=false effect fires, preventing a double-dismiss that breaks
  // BottomSheetModal's internal state and blocks future present() calls).
  const handleDismiss = useCallback(() => {
    isOpenRef.current = false;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (visible && !isOpenRef.current) {
      isOpenRef.current = true;
      ref.current?.present();
    } else if (!visible && isOpenRef.current) {
      ref.current?.dismiss();
    }
  }, [visible]);

  const snapPoints = useMemo(() => {
    // ~8% per row (action/cancel) + 10% extra for title if present + 12% base
    const rows = actions.length + 1; // actions + cancel row
    const pct = Math.max(35, Math.min(70, rows * 8 + 12 + (title ? 10 : 0)));
    return [`${pct}%`];
  }, [actions.length, title]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.accent }]}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface }]}
    >
      <BottomSheetView style={styles.content}>
        {title && (
          <Typography preset="h4" style={styles.title}>{title}</Typography>
        )}
        <View style={styles.list}>
          {actions.map((action, i) => (
            <React.Fragment key={action.label}>
              {i > 0 && <Divider marginV={0} />}
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  { opacity: action.disabled ? 0.5 : pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  const fn = action.onPress;
                  ref.current?.dismiss();
                  setTimeout(fn, 300);
                }}
                disabled={action.disabled}
              >
                <View style={styles.actionRow}>
                  {action.icon ? (
                    <action.icon
                      size={ACTION_ICON_SIZE}
                      color={action.destructive ? colors.alert : colors.textSecondary}
                    />
                  ) : action.iconName ? (
                    <Icon
                      name={action.iconName}
                      size={ACTION_ICON_SIZE}
                      color={action.destructive ? colors.alert : colors.textSecondary}
                    />
                  ) : null}
                  <Typography
                    preset="bodyLg"
                    color={action.destructive ? colors.alert : colors.textPrimary}
                  >
                    {action.label}
                  </Typography>
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
        <Divider />
        <Pressable
          style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => ref.current?.dismiss()}
        >
          <Typography preset="bodyLg" color={colors.textSecondary} align="center">
            {t('common:actions.cancel')}
          </Typography>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: layout.cardRadiusSm,
    borderTopRightRadius: layout.cardRadiusSm,
  },
  handle: {
    width: spacing.huge,
    height: spacing.xs,
  },
  content: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.xxl,
  },
  title: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  list: { gap: 0 },
  item: {
    paddingVertical: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancel: {
    paddingVertical: spacing.md,
  },
});
