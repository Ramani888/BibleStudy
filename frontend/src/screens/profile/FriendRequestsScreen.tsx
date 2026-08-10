import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ListCard } from '../../components/ui/ListCard';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, CloseCircleIcon } from '../../components/icons';
import {
  useFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
} from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { FriendRequest } from '../../types/friends.types';

type Props = ProfileScreenProps<'FriendRequests'>;
type Tab = 'incoming' | 'outgoing';

export function FriendRequestsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState<Tab>('incoming');
  const { data: requests = [], isFetching, error, refetch } = useFriendRequests(tab);
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();
  const cancel = useCancelFriendRequest();

  const handleAccept = (requestId: string) => {
    accept.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Friend request accepted' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleReject = (requestId: string) => {
    reject.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'info', text1: 'Request declined' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const handleCancel = (requestId: string) => {
    cancel.mutate(requestId, {
      onSuccess: () => Toast.show({ type: 'info', text1: 'Request cancelled' }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = useCallback(({ item }: { item: FriendRequest }) => {
    const person = tab === 'incoming' ? item.sender : item.receiver;
    return (
      <ListCard
        leading={<Avatar uri={person?.profileImage ?? null} name={person?.name ?? ''} size="sm" />}
        title={person?.name ?? ''}
        subtitle={person?.church ?? undefined}
        trailing={
          tab === 'incoming' ? (
            <View style={styles.requestActions}>
              <Pressable onPress={() => handleAccept(item.id)} hitSlop={8}>
                <CheckCircleIcon size={28} color={colors.success} />
              </Pressable>
              <Pressable onPress={() => handleReject(item.id)} hitSlop={8}>
                <CloseCircleIcon size={28} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => handleCancel(item.id)} hitSlop={8}>
              <CloseCircleIcon size={28} color={colors.textSecondary} />
            </Pressable>
          )
        }
      />
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, colors]);

  if (error) return <ErrorState message="Could not load requests" onRetry={refetch} />;

  return (
    <Screen
      header={<ScreenHeader title="Friend Requests" onBack={() => navigation.goBack()} />}
    >
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'incoming' && styles.activeTab]}
          onPress={() => setTab('incoming')}
        >
          <Typography preset="label" color={tab === 'incoming' ? colors.primary : colors.textSecondary}>
            Incoming
          </Typography>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'outgoing' && styles.activeTab]}
          onPress={() => setTab('outgoing')}
        >
          <Typography preset="label" color={tab === 'outgoing' ? colors.primary : colors.textSecondary}>
            Sent
          </Typography>
        </Pressable>
      </View>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Requests"
            subtitle={tab === 'incoming' ? 'No pending friend requests' : 'No sent requests'}
          />
        }
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: spacing[3], alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    list: { padding: layout.screenPaddingH },
    separator: { height: spacing[3] },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    requestActions: { flexDirection: 'row', gap: spacing[2] },
  });
}
