import React, { useCallback, useRef } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import type { ProfileScreenProps } from '../../navigation/types';
import { formatDateTime } from '../../utils/formatters';
import { layout, palette, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import {
  BellIcon,
  TrashIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  type IconComponent,
} from '../../components/icons';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification.types';

type Props = ProfileScreenProps<'Notifications'>;

function getNotificationIcon(type: Notification['type']): IconComponent {
  switch (type) {
    case 'friend_request':  return UserPlusIcon;
    case 'friend_accepted': return UsersIcon;
    case 'achievement':     return TrophyIcon;
    case 'system':
    default:                return BellIcon;
  }
}

function groupByDate(notifications: Notification[]): { title: string; data: Notification[] }[] {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

  const buckets = {
    Today: [] as Notification[],
    Yesterday: [] as Notification[],
    Earlier: [] as Notification[],
  };

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= todayStart) buckets.Today.push(n);
    else if (d >= yesterdayStart) buckets.Yesterday.push(n);
    else buckets.Earlier.push(n);
  }

  return (['Today', 'Yesterday', 'Earlier'] as const)
    .filter(k => buckets[k].length > 0)
    .map(k => ({ title: k, data: buckets[k] }));
}

export function NotificationsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { data, isLoading, isFetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const sections = groupByDate(notifications);

  const openSwipeableRef = useRef<Swipeable | null>(null);

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const NotifIcon = getNotificationIcon(item.type);
    let thisSwipeable: Swipeable | null = null;
    return (
      <Swipeable
        ref={r => { thisSwipeable = r; }}
        onSwipeableOpen={() => {
          if (openSwipeableRef.current !== thisSwipeable) openSwipeableRef.current?.close();
          openSwipeableRef.current = thisSwipeable;
        }}
        renderRightActions={() => (
          <Pressable style={[styles.deleteAction, { backgroundColor: colors.alert }]} onPress={() => deleteNotification.mutate(item.id)}>
            <TrashIcon size={20} color={palette.white} />
          </Pressable>
        )}
      >
        <Pressable
          style={[styles.notificationRow, { backgroundColor: colors.background }, !item.read && { backgroundColor: colors.accentSoft }]}
          onPress={() => {
            if (!item.read) markRead.mutate(item.id);
            if (item.type === 'friend_request') navigation.navigate('FriendRequests');
            else if (item.type === 'friend_accepted') navigation.navigate('Friends');
            else if (item.type === 'achievement') navigation.navigate('Achievements');
          }}
        >
          <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceMuted }]}>
            <NotifIcon size={20} color={item.read ? colors.textSecondary : colors.accent} />
          </View>
          <View style={styles.info}>
            <Typography preset="label" numberOfLines={1}>{item.title}</Typography>
            <Typography preset="caption" color={colors.textSecondary} numberOfLines={2}>
              {item.body}
            </Typography>
            <Typography preset="caption" color={colors.textDisabled}>
              {formatDateTime(item.createdAt)}
            </Typography>
          </View>
        </Pressable>
      </Swipeable>
    );
  }, [colors, markRead, deleteNotification, navigation]);

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Typography preset="caption" color={colors.textSecondary}>{title}</Typography>
      </View>
    ),
    [colors.textSecondary, colors.background],
  );

  if (error) return <ErrorState message="Could not load notifications" onRetry={refetch} />;

  const headerRight = unreadCount > 0 ? (
    <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
      <Typography preset="label" color={colors.accent}>Mark all read</Typography>
    </Pressable>
  ) : undefined;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Notifications"
          onBack={() => route.params?.from === 'Home' ? navigation.navigate('HomeTab') : navigation.goBack()}
          right={headerRight}
        />
      }
    >
      <View style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        refreshing={isFetching}
        onRefresh={refetch}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState title="No Notifications" subtitle="You're all caught up!" />
          ) : null
        }
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  sectionHeader: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: layout.screenPaddingH,
    gap: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: spacing.s2 },
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
