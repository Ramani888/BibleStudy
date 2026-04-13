import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '../store';
import { colors } from '../theme';
import { registerDeviceToken, onTokenRefresh, setupForegroundHandler } from '../utils/notifications';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

const ONBOARDING_KEY = '@onboarding_seen';

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);

  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const notificationsSetUp = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setHasOnboarded(val === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  // Register device token and set up FCM listeners when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || notificationsSetUp.current) return;
    notificationsSetUp.current = true;

    registerDeviceToken();
    const unsubRefresh = onTokenRefresh();
    const unsubForeground = setupForegroundHandler();

    return () => {
      unsubRefresh();
      unsubForeground();
      notificationsSetUp.current = false;
    };
  }, [isAuthenticated]);

  // Wait for both auth hydration and onboarding check
  if (!isInitialized || !onboardingChecked) {
    return <SplashScreen />;
  }

  // First-time user: show onboarding before auth
  if (!hasOnboarded) {
    return (
      <OnboardingScreen onComplete={() => setHasOnboarded(true)} />
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
