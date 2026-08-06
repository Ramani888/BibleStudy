import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { QuizStackParamList } from './types';
import { QuizHubScreen } from '../screens/quiz/QuizHubScreen';
import { QuizDetailScreen } from '../screens/quiz/QuizDetailScreen';
import { QuizSetupScreen } from '../screens/quiz/QuizSetupScreen';
import { QuizScreen } from '../screens/quiz/QuizScreen';

const Stack = createNativeStackNavigator<QuizStackParamList>();

export function QuizNavigator() {
  const navigation = useNavigation();

  // Reset the Quiz stack to its root when the tab loses focus (matches other tabs).
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      const tabState = navigation.getState();
      const route = tabState?.routes?.find(r => r.name === 'QuizTab');
      const stackState = route?.state;
      if (stackState && (stackState.index ?? 0) > 0) {
        navigation.dispatch({
          ...CommonActions.reset({ index: 0, routes: [{ name: 'QuizHub' }] }),
          target: stackState.key,
        });
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QuizHub" component={QuizHubScreen} />
      <Stack.Screen name="QuizDetail" component={QuizDetailScreen} />
      <Stack.Screen name="QuizSetup" component={QuizSetupScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
    </Stack.Navigator>
  );
}
