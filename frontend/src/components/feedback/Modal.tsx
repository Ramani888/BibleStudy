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
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../ui';

interface AppModalProps extends Pick<ModalProps, 'visible' | 'animationType'> {
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function AppModal({
  visible,
  animationType = 'slide',
  title,
  onClose,
  children,
  contentStyle,
}: AppModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, contentStyle]}>
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
    padding: layout.screenPaddingH,
    paddingBottom: spacing[8],
  },
  title: {
    marginBottom: spacing[4],
  },
});
