import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { CreditsScreen } from '../screens/profile/CreditsScreen';
import { PaywallScreen } from '../screens/profile/PaywallScreen';
import { AchievementsScreen } from '../screens/profile/AchievementsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { FriendsScreen } from '../screens/profile/FriendsScreen';
import { LeaderboardScreen } from '../screens/profile/LeaderboardScreen';
import { FriendRequestsScreen } from '../screens/profile/FriendRequestsScreen';
import { SearchUsersScreen } from '../screens/profile/SearchUsersScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { BlockedUsersScreen } from '../screens/profile/BlockedUsersScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';
import { NotificationSettingsScreen } from '../screens/profile/NotificationSettingsScreen';
import { NotesScreen } from '../screens/profile/NotesScreen';
import { NoteEditorScreen } from '../screens/profile/NoteEditorScreen';
import { MediaScreen } from '../screens/profile/MediaScreen';
import { MediaPDFViewerScreen } from '../screens/profile/MediaPDFViewerScreen';
import { AboutUsScreen } from '../screens/profile/AboutUsScreen';
import { PrivacyPolicyScreen } from '../screens/profile/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"         component={ProfileScreen}         />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen}     />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen}  />
      <Stack.Screen name="Credits"         component={CreditsScreen}         />
      <Stack.Screen name="Paywall"         component={PaywallScreen}         />
      <Stack.Screen name="Achievements"    component={AchievementsScreen}    />
      <Stack.Screen name="Settings"        component={SettingsScreen}        />
      <Stack.Screen name="Friends"         component={FriendsScreen}         />
      <Stack.Screen name="Leaderboard"     component={LeaderboardScreen}     />
      <Stack.Screen name="FriendRequests"  component={FriendRequestsScreen}  />
      <Stack.Screen name="SearchUsers"     component={SearchUsersScreen}     />
      <Stack.Screen name="UserProfile"     component={UserProfileScreen}     />
      <Stack.Screen name="BlockedUsers"    component={BlockedUsersScreen}    />
      <Stack.Screen name="Notifications"         component={NotificationsScreen}         />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen}   />
      <Stack.Screen name="Notes"           component={NotesScreen}           />
      <Stack.Screen name="NoteEditor"      component={NoteEditorScreen}      options={{ presentation: 'modal' }} />
      <Stack.Screen name="Media"           component={MediaScreen}           />
      <Stack.Screen name="MediaPDFViewer"  component={MediaPDFViewerScreen}  />
      <Stack.Screen name="AboutUs"         component={AboutUsScreen}         />
      <Stack.Screen name="PrivacyPolicy"   component={PrivacyPolicyScreen}   />
    </Stack.Navigator>
  );
}
