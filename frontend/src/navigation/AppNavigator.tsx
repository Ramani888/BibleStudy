import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabParamList } from './types';
import { useTheme, layout } from '../theme';
import {
  HomeIcon,
  LibraryIcon,
  CheckCircleIcon,
  SparklesIcon,
  UserIcon,
  type IconComponent,
} from '../components/icons';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LibraryNavigator } from './LibraryNavigator';
import { QuizNavigator } from './QuizNavigator';
import { AINavigator } from './AINavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { useSubscriptionSync, useSystemBars } from '../hooks';
import { CustomTabBar } from './CustomTabBar';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<keyof AppTabParamList, IconComponent> = {
  HomeTab: HomeIcon,
  LibraryTab: LibraryIcon,
  QuizTab: CheckCircleIcon,
  AITab: SparklesIcon,
  ProfileTab: UserIcon,
};

export function AppNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useSubscriptionSync(); // verify-on-open: re-sync subscription entitlement at launch
  useSystemBars(colors.background);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenLayout={({ children }) => (
        <View style={{ flex: 1, paddingBottom: layout.floatingTabBarHeight + insets.bottom }}>
          {children}
        </View>
      )}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          const TabIcon = TAB_ICONS[route.name as keyof AppTabParamList];
          return <TabIcon size={size ?? 24} color={color} filled={focused} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"    component={HomeScreen}       options={{ title: 'Home'    }} />
      <Tab.Screen name="LibraryTab" component={LibraryNavigator} options={{ title: 'Library' }} />
      <Tab.Screen name="QuizTab"    component={QuizNavigator}    options={{ title: 'Quiz'    }} />
      <Tab.Screen name="AITab"      component={AINavigator}      options={{ title: 'AI Chat' }} />
      {/* popToTopOnBlur: leaving Profile resets its stack to the Profile root, so a
          deep-link (e.g. Home bell → Notifications) doesn't leave the tab stuck there. */}
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile', popToTopOnBlur: true }} />
    </Tab.Navigator>
  );
}
