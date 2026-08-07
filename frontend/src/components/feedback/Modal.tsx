import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  ModalProps,
  Platform,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, useTheme } from '../../theme';
import { Typography } from '../ui';

interface AppModalProps extends Pick<ModalProps, 'visible' | 'animationType'> {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  /** Pinned footer region (usually the primary action button). */
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  /** Show a drag handle pill at the top — use for bottom-sheet style modals */
  showHandle?: boolean;
}

export function AppModal({
  visible,
  animationType = 'slide',
  title,
  onClose,
  children,
  footer,
  contentStyle,
  wrapperStyle,
  showHandle = false,
}: AppModalProps) {
  const theme = useTheme();
  const { spacing } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Bottom sheets (slide) show a drag handle; centered dialogs (fade) don't.
  const showGrabber = showHandle || animationType !== 'fade';
  const insets = useSafeAreaInsets();
  // Bottom sheets need safe-area padding so content clears the home indicator.
  // Centered/fade modals use a fixed base padding.
  // Bottom-anchored sheets (slide) clear the home indicator; centered dialogs (fade) don't.
  const paddingBottom = animationType === 'fade' ? spacing[4] : insets.bottom + spacing[4];

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.wrapper, wrapperStyle]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, contentStyle, { paddingBottom }]}>
          {showGrabber && <View style={styles.handle} />}
          {title && (
            <Typography preset="h4" numberOfLines={1} style={styles.title}>
              {title}
            </Typography>
          )}
          {children}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: spacing[6],
      borderTopRightRadius: spacing[6],
      paddingTop: spacing[4],
      paddingHorizontal: layout.screenPaddingH,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: spacing[0.5],
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing[4],
    },
    title: {
      marginBottom: spacing[4],
    },
    footer: {
      marginTop: spacing[5],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
