import React from 'react';
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
import { layout, radius, spacing, useTheme } from '../../theme';
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
  const { colors } = useTheme();
  // Bottom sheets (slide) show a drag handle; centered dialogs (fade) don't.
  const showGrabber = showHandle || animationType !== 'fade';
  const insets = useSafeAreaInsets();
  // Bottom sheets need safe-area padding so content clears the home indicator.
  // Centered/fade modals use a fixed base padding.
  // Bottom-anchored sheets (slide) clear the home indicator; centered dialogs (fade) don't.
  const paddingBottom = animationType === 'fade' ? spacing.lg : insets.bottom + spacing.lg;

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
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }, contentStyle, { paddingBottom }]}>
          {showGrabber && <View style={[styles.handle, { backgroundColor: colors.border }]} />}
          {title && (
            <Typography preset="h4" numberOfLines={1} style={styles.title}>
              {title}
            </Typography>
          )}
          {children}
          {footer && <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: layout.screenPaddingH,
  },
  handle: {
    width: spacing.huge,
    height: spacing.xs,
    borderRadius: radius.r2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.lg,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
});
