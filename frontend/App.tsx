import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { queryClient } from './src/lib/queryClient';
import { useAuthStore } from './src/store';
import { useTheme, useThemeStore } from './src/theme';
import { RootNavigator } from './src/navigation';
import { configureGoogleSignIn } from './src/utils/socialAuth';
import { SplashScreen } from './src/screens/SplashScreen';
import { useSystemBars } from './src/hooks';

// Enable native screens for better performance
enableScreens(true);
configureGoogleSignIn();

function AppBootstrap() {
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const hydrateTheme = useThemeStore(s => s.hydrate);
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useSystemBars();

  useEffect(() => {
    initialize();
    hydrateTheme();
  }, [initialize, hydrateTheme]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.background}
      />
      <RootNavigator />
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
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <AppBootstrap />
            <Toast />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
});
