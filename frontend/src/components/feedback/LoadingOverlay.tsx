import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, spacing } from '../../theme';

const LOADING_ANIMATION = require('../../assets/animations/loading.json');

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
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
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing[6],
  },
  lottie: {
    width: 80,
    height: 80,
  },
});
