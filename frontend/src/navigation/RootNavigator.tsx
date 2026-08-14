import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

import { useAuthStore } from '../store';
import { useTheme } from '../theme';
import { useSystemBars } from '../hooks';
import {
  registerDeviceToken,
  onTokenRefresh,
  setupForegroundHandler,
  handleNotificationNavigation,
} from '../utils/notifications';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { QuizScreen } from '../screens/quiz/QuizScreen';
import { QuizSummaryScreen } from '../screens/quiz/QuizSummaryScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = '@onboarding_seen';

function SplashScreen() {
  const { colors } = useTheme();
  useSystemBars(colors.background);
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);

  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const notificationsSetUp = useRef(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const navigate = useCallback((screen: string, params: object) => {
    if (navigationRef.current?.isReady()) {
      (navigationRef.current as any).navigate(screen, params);
    }
  }, []);

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

    // Notification deep linking — app opened from quit state
    messaging().getInitialNotification().then(msg => {
      if (msg) handleNotificationNavigation(msg.data as Record<string, string>, navigate);
    });

    // Notification deep linking — app in background, user taps notification
    const unsubNotificationOpen = messaging().onNotificationOpenedApp(msg => {
      handleNotificationNavigation(msg.data as Record<string, string>, navigate);
    });

    return () => {
      unsubRefresh();
      unsubForeground();
      unsubNotificationOpen();
      notificationsSetUp.current = false;
    };
  }, [isAuthenticated, navigate]);

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
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="App" component={AppNavigator} />
          <RootStack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ gestureEnabled: false }}
          />
          <RootStack.Screen name="QuizSummary" component={QuizSummaryScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
