import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal } from '../../../components/feedback';
import { Typography } from '../../../components/ui';
import { spacing, useTheme } from '../../../theme';

/** The 5–15s "generating" overlay shown while an AI quiz is (re)generated. */
export function GeneratingQuizModal({ visible }: { visible: boolean }) {
  const { t } = useTranslation('quiz');
  const { colors } = useTheme();
  return (
    <AppModal visible={visible} contentStyle={styles.modal}>
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Typography preset="h4" align="center">{t('setup.generatingTitle', 'Building your quiz…')}</Typography>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modal: { alignItems: 'center' },
  wrap: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
});
