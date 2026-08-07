import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { layout, spacing, useTheme } from '../../theme';

const LOADING_ANIMATION = require('../../assets/animations/loading.json');

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const { colors } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.box, { backgroundColor: colors.backgroundCard }]}>
          <LottieView
            source={LOADING_ANIMATION}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    borderRadius: layout.cardRadius,
    padding: spacing[6],
  },
  lottie: {
    width: spacing[20],
    height: spacing[20],
  },
});
