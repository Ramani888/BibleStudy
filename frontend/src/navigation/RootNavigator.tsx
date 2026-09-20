import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { storage } from '../utils/storage';
import type { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { QuizScreen } from '../screens/quiz/QuizScreen';
import { QuizSummaryScreen } from '../screens/quiz/QuizSummaryScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

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
  const { colors, name } = useTheme();

  // Theme the navigation container so scene transitions never flash the
  // library default (white) background — matters most in dark mode.
  const navTheme = useMemo(() => {
    const base = name === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: colors.background, card: colors.background } };
  }, [name, colors.background]);

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
    storage.getOnboardingSeen().then(onboarded => {
      setHasOnboarded(onboarded);
      setOnboardingChecked(true);
    });
  }, []);

  // Register device token and set up FCM listeners when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || notificationsSetUp.current) return;
    notificationsSetUp.current = true;

    // Silent: register push only if already permitted — never prompt at login.
    // The OS permission dialog is requested contextually from Notification Settings.
    registerDeviceToken({ prompt: false });
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

  // Wait for auth hydration and onboarding check
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
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {isAuthenticated ? (
        <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
