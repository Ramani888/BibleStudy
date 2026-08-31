import React, { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';

import type { ProfileScreenProps } from '../../navigation/types';
import { Button, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { spacing, useTheme } from '../../theme';

import { useTranslation } from 'react-i18next';

type Props = ProfileScreenProps<'MediaPDFViewer'>;

// Renders natively on-device (react-native-pdf) — the PDF is fetched + cached locally,
// so private media is never handed to a third-party viewer (e.g. Google Docs).
export function MediaPDFViewerScreen({ route, navigation }: Props) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const { url, name } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
        <View style={styles.errorContainer}>
          <Typography preset="h4" align="center" color={colors.textPrimary}>{t('common:status.error', 'Preview unavailable')}</Typography>
          <Typography preset="body" align="center" color={colors.textSecondary} style={styles.errorMessage}>
            {t('profile:media.pdfPreviewError', 'This PDF could not be previewed in-app.')}
          </Typography>
          <Button label={t('common:actions.openBrowser', 'Open in browser')} variant="outline" onPress={() => Linking.openURL(url)} style={styles.errorBtn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
      <View style={styles.pdfWrap}>
        <Pdf
          source={{ uri: url, cache: true }}
          style={styles.pdf}
          onLoadComplete={() => setLoading(false)}
          onError={() => setError(true)}
          trustAllCerts={false}
        />
        {loading && (
          <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pdfWrap: { flex: 1 },
  pdf: { flex: 1, width: '100%' },
  loadingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  errorMessage: { marginTop: spacing.sm },
  errorBtn: { marginTop: spacing.xxl, minWidth: 140 }, // ponytail: off-grid Figma value, no s140 token
});
