import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import { formatDateTime } from '../../utils/formatters';
import { layout, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
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
    // default guards against any backend type the app doesn't know yet —
    // returning undefined here would crash the whole list.
    case 'system':
    default:                return BellIcon;
  }
}

export function NotificationsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { data, isLoading, isFetching, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const NotifIcon = getNotificationIcon(item.type);
    return (
      <Pressable
        style={[styles.notificationRow, !item.read && styles.unread]}
        onPress={() => { if (!item.read) markRead.mutate(item.id); }}
      >
        <View style={styles.iconWrapper}>
          <NotifIcon size={20} color={item.read ? colors.textSecondary : colors.primary} />
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
        <Pressable onPress={() => deleteNotification.mutate(item.id)} hitSlop={8}>
          <TrashIcon size={18} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, markRead, deleteNotification]);

  if (error) return <ErrorState message="Could not load notifications" onRetry={refetch} />;

  return (
    <Screen
      header={<ScreenHeader title="Notifications" onBack={() => navigation.goBack()} />}
    >
      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
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
            <EmptyState title="No Notifications" subtitle="You're all caught up!" />
          ) : null
        }
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    unreadBar: {
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
      paddingHorizontal: layout.screenPaddingH,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing[3],
    },
    unread: { backgroundColor: colors.primarySurface },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: layout.pillRadius,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, gap: spacing[0.5] },
  });
}
