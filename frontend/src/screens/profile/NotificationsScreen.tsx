import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification.types';

type Props = ProfileScreenProps<'Notifications'>;

export function NotificationsScreen(_props: Props) {
  const { data, isLoading, isFetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handlePress = (notification: Notification) => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const date = new Date(item.createdAt);
    return (
      <Pressable
        style={[styles.notificationRow, !item.read && styles.unread]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.iconWrapper}>
          <Icon
            name={getNotificationIcon(item.type)}
            size={20}
            color={item.read ? colors.textSecondary : colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Typography preset="body" numberOfLines={1}>{item.title}</Typography>
          <Typography preset="caption" color={colors.textSecondary} numberOfLines={2}>
            {item.body}
          </Typography>
          <Typography preset="caption" color={colors.textDisabled}>
            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </View>
        <Pressable onPress={() => deleteNotification.mutate(item.id)} hitSlop={8}>
          <Icon name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    );
  };

  if (error) return <ErrorState message="Could not load notifications" onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Typography preset="caption" color={colors.textSecondary}>
            {unreadCount} unread
          </Typography>
          <Button
            label="Mark All Read"
            variant="ghost"
            onPress={() => markAllRead.mutate()}
            style={styles.markAllBtn}
          />
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Notifications"
              subtitle="You're all caught up!"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return 'person-add-outline';
    case 'group':
      return 'people-outline';
    case 'gathering':
    case 'gathering_rsvp':
      return 'calendar-outline';
    default:
      return 'notifications-outline';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  markAllBtn: { paddingHorizontal: spacing[2] },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  unread: {
    backgroundColor: colors.primarySurface,
    marginHorizontal: -layout.screenPaddingH,
    paddingHorizontal: layout.screenPaddingH,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
});
