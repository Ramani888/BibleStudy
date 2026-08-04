import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { LibraryStackParamList } from './types';
import { colors, fontWeights } from '../theme';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { FolderDetailScreen } from '../screens/library/FolderDetailScreen';
import { SetDetailScreen } from '../screens/library/SetDetailScreen';
import { CreateSetScreen } from '../screens/library/CreateSetScreen';
import { EditSetScreen } from '../screens/library/EditSetScreen';
import { CreateCardScreen } from '../screens/library/CreateCardScreen';
import { EditCardScreen } from '../screens/library/EditCardScreen';
import { PublicSetsScreen } from '../screens/library/PublicSetsScreen';
import { FriendsSetsScreen } from '../screens/library/FriendsSetsScreen';
import { QuizScreen } from '../screens/quiz/QuizScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryNavigator() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      const tabState = navigation.getState();
      const route = tabState?.routes?.find(r => r.name === 'LibraryTab');
      const stackState = route?.state;
      if (stackState && (stackState.index ?? 0) > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: 'Library' }] }),
          target: stackState.key,
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
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FolderDetail"
        component={FolderDetailScreen}
        options={({ route }) => ({ title: route.params.folderName })}
      />
      <Stack.Screen
        name="SetDetail"
        component={SetDetailScreen}
        options={({ route }) => ({ title: route.params.setTitle })}
      />
      <Stack.Screen
        name="CreateSet"
        component={CreateSetScreen}
        options={{ title: 'New Set', presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditSet"
        component={EditSetScreen}
        options={{ title: 'Edit Set', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreateCard"
        component={CreateCardScreen}
        options={{ title: 'Add Cards', presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditCard"
        component={EditCardScreen}
        options={{ title: 'Edit Card', presentation: 'modal' }}
      />
      <Stack.Screen
        name="PublicSets"
        component={PublicSetsScreen}
        options={{ title: 'Browse Public Sets' }}
      />
      <Stack.Screen
        name="FriendsSets"
        component={FriendsSetsScreen}
        options={{ title: "Friends' Sets" }}
      />
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
