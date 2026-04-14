import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { colors, fontWeights } from '../theme';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { CreditsScreen } from '../screens/profile/CreditsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { FriendsScreen } from '../screens/profile/FriendsScreen';
import { FriendRequestsScreen } from '../screens/profile/FriendRequestsScreen';
import { SearchUsersScreen } from '../screens/profile/SearchUsersScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { BlockedUsersScreen } from '../screens/profile/BlockedUsersScreen';
import { GroupsScreen } from '../screens/profile/GroupsScreen';
import { GroupDetailScreen } from '../screens/profile/GroupDetailScreen';
import { CreateGroupScreen } from '../screens/profile/CreateGroupScreen';
import { EditGroupScreen } from '../screens/profile/EditGroupScreen';
import { JoinGroupScreen } from '../screens/profile/JoinGroupScreen';
import { PublicGroupsScreen } from '../screens/profile/PublicGroupsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: fontWeights.semiBold,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen}    options={{ title: 'Edit Profile'    }} />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen}  options={{ title: 'Change Password' }} />
      <Stack.Screen name="Credits"         component={CreditsScreen}         options={{ title: 'My Credits'      }} />
      <Stack.Screen name="Settings"        component={SettingsScreen}        options={{ title: 'Settings'        }} />
      {/* Friends */}
      <Stack.Screen name="Friends"         component={FriendsScreen}         options={{ title: 'Friends'         }} />
      <Stack.Screen name="FriendRequests"  component={FriendRequestsScreen}  options={{ title: 'Friend Requests' }} />
      <Stack.Screen name="SearchUsers"     component={SearchUsersScreen}     options={{ title: 'Find Friends'    }} />
      <Stack.Screen name="UserProfile"     component={UserProfileScreen}     options={{ title: 'Profile'         }} />
      <Stack.Screen name="BlockedUsers"    component={BlockedUsersScreen}    options={{ title: 'Blocked Users'   }} />
      {/* Groups */}
      <Stack.Screen name="Groups"          component={GroupsScreen}          options={{ title: 'My Groups'       }} />
      <Stack.Screen name="GroupDetail"     component={GroupDetailScreen}     options={{ title: 'Group'           }} />
      <Stack.Screen name="CreateGroup"     component={CreateGroupScreen}     options={{ title: 'New Group', presentation: 'modal' }} />
      <Stack.Screen name="EditGroup"       component={EditGroupScreen}       options={{ title: 'Edit Group', presentation: 'modal' }} />
      <Stack.Screen name="JoinGroup"       component={JoinGroupScreen}       options={{ title: 'Join Group', presentation: 'modal' }} />
      <Stack.Screen name="PublicGroups"    component={PublicGroupsScreen}    options={{ title: 'Discover Groups'  }} />
      {/* Notifications */}
      <Stack.Screen name="Notifications"   component={NotificationsScreen}   options={{ title: 'Notifications'    }} />
    </Stack.Navigator>
  );
}
