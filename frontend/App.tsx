import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';
import MobileAds from 'react-native-google-mobile-ads';

import { queryClient } from './src/lib/queryClient';
import { useAuthStore } from './src/store';
import { RootNavigator } from './src/navigation';
import { loadInterstitial, loadAppOpen, showAppOpen } from './src/ads/adManager';

// Enable native screens for better performance
enableScreens(true);

function AppBootstrap() {
  const initialize    = useAuthStore(s => s.initialize);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const appStateRef   = useRef<AppStateStatus>(AppState.currentState);

  // Init auth
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Init AdMob SDK once, then preload full-screen ads
  useEffect(() => {
    MobileAds()
      .initialize()
      .then(() => {
        loadInterstitial();
        loadAppOpen();
      })
      .catch(() => {});
  }, []);

  // Show App Open ad when app comes to foreground (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        showAppOpen();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppBootstrap />
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
