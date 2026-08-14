import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme, spacing, layout } from '../theme';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + spacing.sm }]}>
      <View style={[styles.pill, { backgroundColor: colors.bottomBar }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconColor = isFocused ? colors.textOnAccent : colors.tabInactive;
          const icon = options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 22 });

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
            >
              <View style={[styles.bubble, isFocused && { backgroundColor: colors.accent }]}>
                {icon}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: layout.pillRadius,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    elevation: 0,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 48,
    height: 48,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
