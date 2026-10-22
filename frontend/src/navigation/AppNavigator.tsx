import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { AppTabParamList } from './types';
import { useTheme } from '../theme';
import { FloatingTabBar } from './FloatingTabBar';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LibraryNavigator } from './LibraryNavigator';
import { QuizNavigator } from './QuizNavigator';
import { AINavigator } from './AINavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useTranslation } from 'react-i18next';
import { useSubscriptionSync, useSystemBars, useNewAchievements } from '../hooks';
import { AchievementUnlockModal } from '../components/feedback/AchievementUnlockModal';

const Tab = createBottomTabNavigator<AppTabParamList>();

function AchievementGate() {
  const { achievement, dismiss } = useNewAchievements();
  return <AchievementUnlockModal achievement={achievement} onDismiss={dismiss} />;
}

export function AppNavigator() {
  const { t } = useTranslation('navigation');
  const { qm } = useTheme();

  useSubscriptionSync(); // verify-on-open: re-sync subscription entitlement at launch
  useSystemBars(qm.bg); // nav bar blends with the strip under the floating tab bar

  return (
    <>
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: qm.bg },
      }}
    >
      <Tab.Screen name="HomeTab"    component={HomeScreen}       options={{ title: t('tabs.home') }} />
      <Tab.Screen name="LibraryTab" component={LibraryNavigator} options={{ title: t('tabs.library') }} />
      <Tab.Screen name="QuizTab"    component={QuizNavigator}    options={{ title: t('tabs.study') }} />
      <Tab.Screen name="AITab"      component={AINavigator}      options={{ title: t('tabs.ai') }} />
      {/* popToTopOnBlur: leaving Profile resets its stack to the Profile root, so a
          deep-link (e.g. Home bell → Notifications) doesn't leave the tab stuck there. */}
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: t('tabs.profile'), popToTopOnBlur: true }} />
    </Tab.Navigator>
    <AchievementGate />
    </>
  );
}
