import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { StudyPlansScreen } from '../screens/library/StudyPlansScreen';
import { PlanDetailScreen } from '../screens/library/PlanDetailScreen';
import { CreatePlanScreen } from '../screens/library/CreatePlanScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
      <Stack.Screen name="SetDetail" component={SetDetailScreen} />
      <Stack.Screen name="PublicSets" component={PublicSetsScreen} />
      <Stack.Screen name="FriendsSets" component={FriendsSetsScreen} />
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
      <Stack.Screen name="StudyPlans" component={StudyPlansScreen} />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
      <Stack.Screen name="CreatePlan" component={CreatePlanScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
