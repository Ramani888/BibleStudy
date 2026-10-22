import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AnimatedPressable, Typography } from '../components/ui';
import {
  TabHomeIcon,
  TabLibraryIcon,
  TabQuizIcon,
  TabAskIcon,
  TabProfileIcon,
} from '../components/icons';
import { useTheme, spacing } from '../theme';
import type { AppTabParamList } from './types';

const BAR_H = 66; // canvas tab bar height
const PILL_RADIUS = spacing.lg; // half the active pill's height

const TAB_ICONS: Record<keyof AppTabParamList, typeof TabHomeIcon> = {
  HomeTab: TabHomeIcon,
  LibraryTab: TabLibraryIcon,
  QuizTab: TabQuizIcon,
  AITab: TabAskIcon,
  ProfileTab: TabProfileIcon,
};

/**
 * Quiet-morning floating pill tab bar. Sits in normal layout (not absolute), so
 * no screen needs extra bottom padding; the strip around it is the page colour.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: qm.bg, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={[styles.bar, { backgroundColor: qm.tabBg, boxShadow: qm.tabShadow }]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = TAB_ICONS[route.name as keyof AppTabParamList];
          const color = focused ? qm.tabOn : qm.tabIdle;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <AnimatedPressable
              key={route.key}
              scaleTo={0.92}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
            >
              {/* Radius must ride along with the background: on Android (Fabric) a View that
                  gains a background after mount drops a radius it was mounted with. */}
              <View style={[styles.pill, focused && { backgroundColor: qm.tabPill, borderRadius: PILL_RADIUS }]}>
                {focused ? (
                  <Animated.View key="on" entering={ZoomIn.springify().damping(12)}>
                    <Icon size={24} color={color} filled cutout={qm.tabPill} />
                  </Animated.View>
                ) : (
                  <Icon size={24} color={color} />
                )}
              </View>
              <Typography preset={focused ? 'qmTabOn' : 'qmTab'} color={color} numberOfLines={1}>{label}</Typography>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.s6 },
  bar: {
    height: BAR_H, borderRadius: BAR_H / 2,
    flexDirection: 'row', alignItems: 'center',
  },
  tab: { flex: 1, alignItems: 'center', gap: spacing.s3 },
  pill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.s14 },
});
