import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing[8],
  },
});
