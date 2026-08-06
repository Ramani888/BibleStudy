import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { ProfileStackParamList } from './types';
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"         component={ProfileScreen}         />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen}     />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen}  />
      <Stack.Screen name="Credits"         component={CreditsScreen}         />
      <Stack.Screen name="Settings"        component={SettingsScreen}        />
      <Stack.Screen name="Friends"         component={FriendsScreen}         />
      <Stack.Screen name="FriendRequests"  component={FriendRequestsScreen}  />
      <Stack.Screen name="SearchUsers"     component={SearchUsersScreen}     />
      <Stack.Screen name="UserProfile"     component={UserProfileScreen}     />
      <Stack.Screen name="BlockedUsers"    component={BlockedUsersScreen}    />
      <Stack.Screen name="Groups"          component={GroupsScreen}          />
      <Stack.Screen name="GroupDetail"     component={GroupDetailScreen}     />
      <Stack.Screen name="CreateGroup"     component={CreateGroupScreen}     options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditGroup"       component={EditGroupScreen}       options={{ presentation: 'modal' }} />
      <Stack.Screen name="JoinGroup"       component={JoinGroupScreen}       options={{ presentation: 'modal' }} />
      <Stack.Screen name="PublicGroups"    component={PublicGroupsScreen}    />
      <Stack.Screen name="Notifications"   component={NotificationsScreen}   />
      <Stack.Screen name="Notes"           component={NotesScreen}           />
      <Stack.Screen name="NoteEditor"      component={NoteEditorScreen}      options={{ presentation: 'modal' }} />
      <Stack.Screen name="Media"           component={MediaScreen}           />
      <Stack.Screen name="MediaPDFViewer"  component={MediaPDFViewerScreen}  />
    </Stack.Navigator>
  );
}
