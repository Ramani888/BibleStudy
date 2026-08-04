import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { queryClient } from './src/lib/queryClient';
import { useAuthStore } from './src/store';
import { RootNavigator } from './src/navigation';

// Enable native screens for better performance
enableScreens(true);

function AppBootstrap() {
  const initialize = useAuthStore(s => s.initialize);

  // Init auth
  useEffect(() => {
    initialize();
  }, [initialize]);

  return <RootNavigator />;
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
  root: { flex: 1 },
});
