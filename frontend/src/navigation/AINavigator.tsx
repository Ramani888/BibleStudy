import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { AIStackParamList } from './types';
import { AIChatScreen } from '../screens/ai/AIChatScreen';
import { ChatHistoryScreen } from '../screens/ai/ChatHistoryScreen';

const Stack = createNativeStackNavigator<AIStackParamList>();

export function AINavigator() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      const tabState = navigation.getState();
      const route = tabState?.routes?.find(r => r.name === 'AITab');
      const stackState = route?.state;
      if (stackState && (stackState.index ?? 0) > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: 'AIChat' }] }),
          target: stackState.key,
        });
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIChat" component={AIChatScreen} />
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
    </Stack.Navigator>
  );
}
