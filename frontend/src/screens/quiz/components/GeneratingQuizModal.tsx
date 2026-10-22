import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../../components/ui';
import { spacing, useTheme } from '../../../theme';

/** The 5–15s full-screen "Making your quiz…" overlay while an AI quiz is (re)generated. */
export function GeneratingQuizModal({ visible }: { visible: boolean }) {
  const { t } = useTranslation('quiz');
  const { qm } = useTheme();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={[styles.wrap, { backgroundColor: qm.bg }]} accessibilityRole="progressbar" accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={qm.violet} />
        <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.title}>{t('qm.making', 'Making your quiz…')}</Typography>
        <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.sub}>{t('qm.makingSub', 'This takes a few seconds')}</Typography>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { marginTop: spacing.s22 },
  sub: { marginTop: spacing.sm },
});
