import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useFriendRequests,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { FriendRequest } from '../../types/friends.types';

type Props = ProfileScreenProps<'FriendRequests'>;
type Tab = 'incoming' | 'outgoing';

export function FriendRequestsScreen(_props: Props) {
  const [tab, setTab] = useState<Tab>('incoming');
  const { data: requests = [], isLoading, refetch } = useFriendRequests(tab);
  const accept = useAcceptFriendRequest();
  const reject = useRejectFriendRequest();

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

  const renderItem = ({ item }: { item: FriendRequest }) => {
    const person = tab === 'incoming' ? item.sender : item.receiver;
    return (
      <View style={styles.requestRow}>
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.info}>
          <Typography preset="body">{person?.name}</Typography>
          {person?.church ? (
            <Typography preset="caption" color={colors.textSecondary}>{person.church}</Typography>
          ) : null}
        </View>
        {tab === 'incoming' && (
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.acceptBtn]} onPress={() => handleAccept(item.id)}>
              <Icon name="checkmark" size={18} color={colors.textOnPrimary} />
            </Pressable>
            <Pressable style={[styles.btn, styles.rejectBtn]} onPress={() => handleReject(item.id)}>
              <Icon name="close" size={18} color={colors.textOnPrimary} />
            </Pressable>
          </View>
        )}
        {tab === 'outgoing' && (
          <Typography preset="caption" color={colors.textSecondary}>Pending</Typography>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab switcher */}
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
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={requests.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Requests"
            subtitle={tab === 'incoming' ? 'No pending friend requests' : 'No sent requests'}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing[3], alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing[2] },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error },
});
