import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import './src/i18n';
import { useLanguageStore } from './src/i18n';
import { queryClient, persistOptions } from './src/lib/queryClient';
import { OfflineBanner } from './src/components/feedback';
import { useAuthStore } from './src/store';
import { useTheme, useThemeStore } from './src/theme';
import { RootNavigator } from './src/navigation';
import { configureGoogleSignIn } from './src/utils/socialAuth';
import { configureRevenueCat } from './src/lib/purchases';
import { identify, resetAnalytics } from './src/lib/analytics';
import { useAnalyticsStore } from './src/store';
import { SplashScreen } from './src/screens/SplashScreen';
// Enable native screens for better performance
enableScreens(true);
configureGoogleSignIn();
configureRevenueCat();
// Analytics is configured inside useAnalyticsStore.hydrate() (below), AFTER the
// opt-out preference is read — see analytics.store for why.

function AppBootstrap() {
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const userId = useAuthStore(s => s.user?.id);
  const hydrateTheme = useThemeStore(s => s.hydrate);
  const hydrateLanguage = useLanguageStore(s => s.hydrate);
  const hydrateAnalytics = useAnalyticsStore(s => s.hydrate);
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initialize();
    hydrateTheme();
    hydrateLanguage();
    hydrateAnalytics();
  }, [initialize, hydrateTheme, hydrateLanguage, hydrateAnalytics]);

  // Link analytics to the signed-in user; reset to anonymous on logout.
  useEffect(() => {
    if (userId) identify(userId);
    else resetAnalytics();
  }, [userId]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />
      <RootNavigator />
      <OfflineBanner />
      {showSplash && (
        <SplashScreen
          isReady={isInitialized}
          onFinish={() => setShowSplash(false)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <BottomSheetModalProvider>
            <AppBootstrap />
            <Toast />
          </BottomSheetModalProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
