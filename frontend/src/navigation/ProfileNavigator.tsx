import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
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
import { NotesScreen } from '../screens/profile/NotesScreen';
import { NoteEditorScreen } from '../screens/profile/NoteEditorScreen';
import { MediaScreen } from '../screens/profile/MediaScreen';
import { MediaPDFViewerScreen } from '../screens/profile/MediaPDFViewerScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  // `navigation` here is the TAB navigator's context (parent of ProfileNavigator).
  // When ProfileTab loses focus (user switches to another tab), we reset the
  // Profile stack to the root screen — invisibly, while the user is already
  // on a different tab, so there is no visible flash.
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      const tabState = navigation.getState();
      const profileTabRoute = tabState?.routes?.find(r => r.name === 'ProfileTab');
      const profileStackState = profileTabRoute?.state;

      if (profileStackState && (profileStackState.index ?? 0) > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: 'Profile' }] }),
          target: profileStackState.key,
        });
      }
    });
    return unsubscribe;
  }, [navigation]);

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
      {/* Notes */}
      <Stack.Screen name="Notes"           component={NotesScreen}           options={{ title: 'My Notes'         }} />
      <Stack.Screen name="NoteEditor"      component={NoteEditorScreen}      options={{ title: 'New Note'         }} />
      {/* Media */}
      <Stack.Screen name="Media"           component={MediaScreen}           options={{ title: 'My Media'         }} />
      <Stack.Screen name="MediaPDFViewer"  component={MediaPDFViewerScreen}  options={{ title: ''                 }} />
    </Stack.Navigator>
  );
}
