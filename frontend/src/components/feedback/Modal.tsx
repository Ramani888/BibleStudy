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
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../ui';

interface AppModalProps extends Pick<ModalProps, 'visible' | 'animationType'> {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
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
  contentStyle,
  wrapperStyle,
  showHandle = false,
}: AppModalProps) {
  const insets = useSafeAreaInsets();
  // Bottom sheets need safe-area padding so content clears the home indicator.
  // Centered/fade modals use a fixed base padding.
  const paddingBottom = showHandle ? insets.bottom + spacing[3] : spacing[4];

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.wrapper, wrapperStyle]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, contentStyle, { paddingBottom }]}>
          {showHandle && <View style={styles.handle} />}
          {title && (
            <Typography preset="h4" style={styles.title}>
              {title}
            </Typography>
          )}
          {children}
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
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing[4],
    paddingHorizontal: layout.screenPaddingH,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[4],
  },
});
