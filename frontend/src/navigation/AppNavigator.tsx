import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import type { AppTabParamList } from './types';
import { colors, fontSizes, fontWeights, layout, spacing } from '../theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { StudyScreen } from '../screens/study/StudyScreen';
import { LibraryNavigator } from './LibraryNavigator';
import { AINavigator } from './AINavigator';
import { ProfileNavigator } from './ProfileNavigator';

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab:    { active: 'home',          inactive: 'home-outline'          },
  LibraryTab: { active: 'library',       inactive: 'library-outline'       },
  StudyTab:   { active: 'school',        inactive: 'school-outline'        },
  AITab:      { active: 'chatbubbles',   inactive: 'chatbubbles-outline'   },
  ProfileTab: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Icon name={name} size={size ?? 24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"    component={HomeScreen}       options={{ title: 'Home'    }} />
      <Tab.Screen name="LibraryTab" component={LibraryNavigator} options={{ title: 'Library' }} />
      <Tab.Screen name="StudyTab"   component={StudyScreen}      options={{ title: 'Study'   }} />
      <Tab.Screen name="AITab"      component={AINavigator}      options={{ title: 'AI Chat' }} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: layout.tabBarHeight,
    paddingBottom: spacing[2],
    paddingTop: spacing[1],
  },
  tabLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
});
