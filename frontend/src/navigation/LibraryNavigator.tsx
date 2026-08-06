import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { LibraryStackParamList } from './types';
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="SetDetail" component={SetDetailScreen} />
      <Stack.Screen
        name="CreateSet"
        component={CreateSetScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditSet"
        component={EditSetScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreateCard"
        component={CreateCardScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditCard"
        component={EditCardScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="PublicSets" component={PublicSetsScreen} />
      <Stack.Screen name="FriendsSets" component={FriendsSetsScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
    </Stack.Navigator>
  );
}
