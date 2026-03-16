import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AIStackParamList } from './types';
import { colors, fontWeights } from '../theme';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { ChatHistoryScreen } from '../screens/ai/ChatHistoryScreen';

const Stack = createNativeStackNavigator<AIStackParamList>();

export function AINavigator() {
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
        name="AIChat"
        component={AIChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatHistory"
        component={ChatHistoryScreen}
        options={{ title: 'Chat History' }}
      />
    </Stack.Navigator>
  );
}
