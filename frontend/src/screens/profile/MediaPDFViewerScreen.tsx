import React, { useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { ProfileScreenProps } from '../../navigation/types';
import { Button, Typography } from '../../components/ui';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'MediaPDFViewer'>;

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
  const styles = makeStyles(colors);
  const { url, name } = route.params;
  const [loadError, setLoadError] = useState(false);

  if (Platform.OS === 'android') {
    return (
      <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
        <AndroidPDFViewer url={url} colors={colors} styles={styles} />
      </Screen>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Pdf = require('react-native-pdf').default as React.ComponentType<{
    source: { uri: string; cache: boolean };
    style: object;
    onError: () => void;
    renderActivityIndicator: () => React.ReactElement;
  }>;

  if (loadError) {
    return (
      <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
        <ErrorState message="Could not load PDF" onRetry={() => setLoadError(false)} />
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title={name} onBack={() => navigation.goBack()} />}>
      <View style={styles.pdfWrap}>
        <Pdf
          source={{ uri: url, cache: true }}
          style={styles.pdf}
          onError={() => setLoadError(true)}
          renderActivityIndicator={() => (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        />
      </View>
    </Screen>
  );
}

function AndroidPDFViewer({ url, colors, styles }: {
  url: string;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typography preset="h4" align="center" color={colors.textPrimary}>Preview unavailable</Typography>
        <Typography preset="body" align="center" color={colors.textSecondary} style={styles.errorMessage}>
          This PDF could not be previewed in-app.
        </Typography>
        <Button label="Open in browser" variant="outline" onPress={() => Linking.openURL(url)} style={styles.errorBtn} />
      </View>
    );
  }

  return (
    <View style={styles.pdfWrap}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.pdf}
        injectedJavaScript={GOOGLE_DOCS_ERROR_DETECTOR}
        onMessage={(e) => { if (e.nativeEvent.data === 'PDF_LOAD_ERROR') setError(true); }}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    pdfWrap: { flex: 1 },
    pdf: { flex: 1, width: '100%' },
    loadingOverlay: {
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[8],
    },
    errorMessage: { marginTop: spacing[2] },
    errorBtn: { marginTop: spacing[6], minWidth: 140 },
  });
}
