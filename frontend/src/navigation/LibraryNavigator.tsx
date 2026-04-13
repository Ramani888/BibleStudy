import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { StudyScreen } from '../screens/study/StudyScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryNavigator() {
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
        name="Study"
        component={StudyScreen}
        options={({ route }) => ({ title: route.params.setTitle, headerShown: false })}
      />
    </Stack.Navigator>
  );
}
