import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { LibraryStackParamList } from './types';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { FolderDetailScreen } from '../screens/library/FolderDetailScreen';
import { CreateSetScreen } from '../screens/library/CreateSetScreen';
import { EditSetScreen } from '../screens/library/EditSetScreen';
import { CreateCardScreen } from '../screens/library/CreateCardScreen';
import { EditCardScreen } from '../screens/library/EditCardScreen';
import { StudyPlansScreen } from '../screens/library/StudyPlansScreen';
import { PlanDetailScreen } from '../screens/library/PlanDetailScreen';
import { CreatePlanScreen } from '../screens/library/CreatePlanScreen';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="FolderDetail" component={FolderDetailScreen} />
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
