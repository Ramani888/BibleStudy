import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

import { useAuthStore } from '../store';
import { useTheme } from '../theme';
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
// Cross-cutting modal screens
import { NotesScreen } from '../screens/profile/NotesScreen';
import { NoteEditorScreen } from '../screens/profile/NoteEditorScreen';
import { MediaScreen } from '../screens/profile/MediaScreen';
import { MediaPDFViewerScreen } from '../screens/profile/MediaPDFViewerScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { FriendsScreen } from '../screens/profile/FriendsScreen';
import { LeaderboardScreen } from '../screens/profile/LeaderboardScreen';
import { FriendRequestsScreen } from '../screens/profile/FriendRequestsScreen';
import { SearchUsersScreen } from '../screens/profile/SearchUsersScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { BlockedUsersScreen } from '../screens/profile/BlockedUsersScreen';
import { PaywallScreen } from '../screens/profile/PaywallScreen';
import { CreditsScreen } from '../screens/profile/CreditsScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { SetDetailScreen } from '../screens/library/SetDetailScreen';
import { PublicSetsScreen } from '../screens/library/PublicSetsScreen';
import { FriendsSetsScreen } from '../screens/library/FriendsSetsScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = '@onboarding_seen';

function SplashScreen() {
  const { colors } = useTheme();
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
          {/* Cross-cutting modals — back always returns to the caller screen */}
          <RootStack.Screen name="Notes"          component={NotesScreen}          />
          <RootStack.Screen name="NoteEditor"     component={NoteEditorScreen}     options={{ presentation: 'modal' }} />
          <RootStack.Screen name="Media"          component={MediaScreen}          />
          <RootStack.Screen name="MediaPDFViewer" component={MediaPDFViewerScreen} />
          <RootStack.Screen name="Notifications"  component={NotificationsScreen}  />
          <RootStack.Screen name="Friends"        component={FriendsScreen}        />
          <RootStack.Screen name="Leaderboard"    component={LeaderboardScreen}    />
          <RootStack.Screen name="FriendRequests" component={FriendRequestsScreen} />
          <RootStack.Screen name="SearchUsers"    component={SearchUsersScreen}    />
          <RootStack.Screen name="UserProfile"    component={UserProfileScreen}    />
          <RootStack.Screen name="BlockedUsers"   component={BlockedUsersScreen}   />
          <RootStack.Screen name="Paywall"        component={PaywallScreen}        />
          <RootStack.Screen name="Credits"        component={CreditsScreen}        />
          <RootStack.Screen name="Achievements"   component={AchievementsScreen}   />
          {/* view-only; isOwner=false hides all edit actions so Library nav calls never fire */}
          <RootStack.Screen name="SetDetail"      component={SetDetailScreen as any}   />
          <RootStack.Screen name="PublicSets"     component={PublicSetsScreen as any}  />
          <RootStack.Screen name="FriendsSets"    component={FriendsSetsScreen as any} />
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
