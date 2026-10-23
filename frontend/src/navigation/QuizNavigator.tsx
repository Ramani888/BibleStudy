import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';
import type { QuizStackParamList } from './types';
import type { FromHome } from './returnHome';
import { QuizHubScreen } from '../screens/quiz/QuizHubScreen';
import { QuizDetailScreen } from '../screens/quiz/QuizDetailScreen';
import { QuizSetupScreen } from '../screens/quiz/QuizSetupScreen';

const Stack = createNativeStackNavigator<QuizStackParamList>();

export function QuizNavigator() {
  const navigation = useNavigation();
  const { qm } = useTheme();

  // Reset the Quiz stack to its root only when the user actually switches to
  // another tab — not when a root-stack screen (Quiz, QuizSummary) overlays App.
  // We detect a real tab switch by checking that QuizTab is no longer the
  // selected tab at the time the blur fires.
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      const tabState = navigation.getState();
      const selectedRoute = tabState?.routes?.[tabState.index ?? 0];
      if (selectedRoute?.name === 'QuizTab') return; // root overlay, not a tab switch
      // Paywall opened from Quiz (out of credits) returns here — keep the New quiz form.
      // The target tab's stack may not be mounted yet, so its screen params can still sit on the tab route.
      const shown = selectedRoute?.state ? selectedRoute.state.routes[selectedRoute.state.index ?? 0] : undefined;
      const from = ((shown?.params ?? (selectedRoute?.params as { params?: object } | undefined)?.params) as FromHome)?.from;
      if (from === 'QuizTab') return;
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
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: qm.bg } }}>
      <Stack.Screen name="QuizHub" component={QuizHubScreen} />
      <Stack.Screen name="QuizDetail" component={QuizDetailScreen} />
      <Stack.Screen name="QuizSetup" component={QuizSetupScreen} />
    </Stack.Navigator>
  );
}
