import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { RootScreenProps } from '../../navigation/types';
import { Button, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { spacing, useTheme } from '../../theme';

type Props = RootScreenProps<'MediaPDFViewer'>;

// Android: Google Docs can't reliably preview private/direct S3 URLs —
// detect its error page and surface a fallback.
const GOOGLE_DOCS_ERROR_DETECTOR = `
  (function() {
    var checks = 0;
    var timer = setInterval(function() {
      checks++;
      var text = document.body ? (document.body.innerText || '') : '';
      if (
        text.toLowerCase().includes('unable to generate') ||
        text.toLowerCase().includes('no preview available') ||
        text.toLowerCase().includes("can't preview")
      ) {
        clearInterval(timer);
        window.ReactNativeWebView.postMessage('PDF_LOAD_ERROR');
      }
      if (checks >= 20) clearInterval(timer);
    }, 1000);
  })();
  true;
`;

export function MediaPDFViewerScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { url, name } = route.params;

  const viewerUrl = Platform.OS === 'android'
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
    : url; // WKWebView on iOS renders PDFs natively from a direct URL

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
        <View style={styles.errorContainer}>
          <Typography preset="h4" align="center" color={colors.textPrimary}>Preview unavailable</Typography>
          <Typography preset="body" align="center" color={colors.textSecondary} style={styles.errorMessage}>
            This PDF could not be previewed in-app.
          </Typography>
          <Button label="Open in browser" variant="outline" onPress={() => Linking.openURL(url)} style={styles.errorBtn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
      <View style={styles.pdfWrap}>
        <WebView
          source={{ uri: viewerUrl }}
          style={styles.pdf}
          injectedJavaScript={Platform.OS === 'android' ? GOOGLE_DOCS_ERROR_DETECTOR : undefined}
          onMessage={(e) => { if (e.nativeEvent.data === 'PDF_LOAD_ERROR') setError(true); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => setError(true)}
          onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) setError(true); }}
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
