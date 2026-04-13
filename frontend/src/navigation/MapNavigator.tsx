import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MapStackParamList } from './types';
import { colors, fontWeights } from '../theme';
import { MapScreen } from '../screens/map/MapScreen';
import { GatheringDetailScreen } from '../screens/map/GatheringDetailScreen';
import { CreateGatheringScreen } from '../screens/map/CreateGatheringScreen';
import { EditGatheringScreen } from '../screens/map/EditGatheringScreen';

const Stack = createNativeStackNavigator<MapStackParamList>();

export function MapNavigator() {
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
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GatheringDetail"
        component={GatheringDetailScreen}
        options={{ title: 'Gathering' }}
      />
      <Stack.Screen
        name="CreateGathering"
        component={CreateGatheringScreen}
        options={{ title: 'New Gathering', presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditGathering"
        component={EditGatheringScreen}
        options={{ title: 'Edit Gathering', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
