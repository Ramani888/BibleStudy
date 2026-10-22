import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { layout, spacing, useTheme } from '../../theme';

const LOADING_ANIMATION = require('../../assets/animations/loading.json');

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const { qm } = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.backdrop, { backgroundColor: qm.scrim }]}>
        <View style={[styles.box, { backgroundColor: qm.sheet }]}>
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
    padding: spacing.xxl,
  },
  lottie: {
    width: spacing.s80,
    height: spacing.s80,
  },
});
