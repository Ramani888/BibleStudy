import React, { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { ProfileScreenProps } from '../../navigation/types';
import { Button, Typography } from '../../components/ui';
import { ErrorState } from '../../components/feedback/ErrorState';
import { colors, spacing } from '../../theme';

type Props = ProfileScreenProps<'MediaPDFViewer'>;

// Polls the Google Docs viewer page for error text and notifies RN when preview
// fails. Google returns HTTP 200 even on failure so onError never fires — JS
// detection is the only way to catch the "preview unavailable" page.
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
  const { url, name } = route.params;
  const [loadError, setLoadError] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  // Android: WebView + Google Docs viewer — react-native-pdf has new-arch init
  // issues on Android with RN 0.84. The Docs viewer works in-app without native modules.
  if (Platform.OS === 'android') {
    return <AndroidPDFViewer url={url} />;
  }

  // iOS: use react-native-pdf (works correctly on iOS).
  // Lazy require so a broken Android native module doesn't crash the JS bundle.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Pdf = require('react-native-pdf').default as React.ComponentType<{
    source: { uri: string; cache: boolean };
    style: object;
    onError: () => void;
    renderActivityIndicator: () => React.ReactElement;
  }>;

  if (loadError) {
    return <ErrorState message="Could not load PDF" onRetry={() => setLoadError(false)} />;
  }

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: url, cache: true }}
        style={styles.pdf}
        onError={() => setLoadError(true)}
        renderActivityIndicator={() => (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      />
    </View>
  );
}

function AndroidPDFViewer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Typography preset="h4" align="center" color={colors.textPrimary}>
          Preview unavailable
        </Typography>
        <Typography
          preset="body"
          align="center"
          color={colors.textSecondary}
          style={styles.errorMessage}
        >
          This PDF could not be previewed in-app.
        </Typography>
        <Button
          label="Open in browser"
          variant="outline"
          onPress={() => Linking.openURL(url)}
          style={styles.errorBtn}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: viewerUrl }}
        style={styles.pdf}
        injectedJavaScript={GOOGLE_DOCS_ERROR_DETECTOR}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'PDF_LOAD_ERROR') setError(true);
        }}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.background,
  },
  errorMessage: { marginTop: spacing[2] },
  errorBtn: { marginTop: spacing[6], minWidth: 140 },
});
