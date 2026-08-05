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
import { Theme, useTheme } from '../../theme';

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

export function ActionSheet({ visible, title, actions, onClose }: ActionSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}
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
                  { opacity: pressed || action.disabled ? 0.5 : 1 },
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
                      color={action.destructive ? colors.error : colors.textSecondary}
                    />
                  ) : action.iconName ? (
                    <Icon
                      name={action.iconName}
                      size={ACTION_ICON_SIZE}
                      color={action.destructive ? colors.error : colors.textSecondary}
                    />
                  ) : null}
                  <Typography
                    preset="bodyLg"
                    color={action.destructive ? colors.error : colors.textPrimary}
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
          style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => ref.current?.dismiss()}
        >
          <Typography preset="bodyLg" color={colors.textSecondary} align="center">
            Cancel
          </Typography>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    background: {
      backgroundColor: colors.backgroundCard,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
    },
    handle: {
      backgroundColor: colors.primaryLight,
      width: 40,
      height: 4,
    },
    content: {
      paddingHorizontal: layout.screenPaddingH,
      paddingBottom: spacing[6],
    },
    title: {
      marginBottom: spacing[4],
      marginTop: spacing[2],
    },
    list: { gap: 0 },
    item: {
      paddingVertical: spacing[4],
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
    },
    cancel: {
      paddingVertical: spacing[3],
    },
  });
