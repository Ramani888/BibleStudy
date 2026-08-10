import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppTabParamList } from './types';
import { fontSizes, fontWeights, layout, spacing, useTheme, type ThemeColors } from '../theme';
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
import { useSubscriptionSync } from '../hooks';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<keyof AppTabParamList, IconComponent> = {
  HomeTab: HomeIcon,
  LibraryTab: LibraryIcon,
  QuizTab: CheckCircleIcon,
  AITab: SparklesIcon,
  ProfileTab: UserIcon,
};

export function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);

  useSubscriptionSync(); // verify-on-open: re-sync subscription entitlement at launch

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          const TabIcon = TAB_ICONS[route.name as keyof AppTabParamList];
          return <TabIcon size={size ?? 24} color={color} />;
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

const makeStyles = (colors: ThemeColors, bottomInset: number) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.background,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: layout.tabBarHeight + bottomInset,
      paddingTop: spacing.xs,
      paddingBottom: bottomInset + spacing.xs,
    },
    tabLabel: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
    },
  });
