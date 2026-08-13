import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { NotificationSettingsScreen } from '../screens/profile/NotificationSettingsScreen';
import { AboutUsScreen } from '../screens/profile/AboutUsScreen';
import { PrivacyPolicyScreen } from '../screens/profile/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"              component={ProfileScreen}              />
      <Stack.Screen name="EditProfile"          component={EditProfileScreen}          />
      <Stack.Screen name="ChangePassword"       component={ChangePasswordScreen}       />
      <Stack.Screen name="Settings"             component={SettingsScreen}             />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="AboutUs"              component={AboutUsScreen}              />
      <Stack.Screen name="PrivacyPolicy"        component={PrivacyPolicyScreen}        />
    </Stack.Navigator>
  );
}
