import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useBlockedUsers, useUnblockUser } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { BlockedUser } from '../../types/friends.types';

type Props = ProfileScreenProps<'BlockedUsers'>;

export function BlockedUsersScreen(_props: Props) {
  const { data: blocked = [], isLoading, isFetching, error, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();

  const handleUnblock = (userId: string, name: string) => {
    unblock.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} unblocked` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Icon name="person" size={20} color={colors.textSecondary} />
      </View>
      <Typography preset="body" style={styles.name}>{item.blocked.name}</Typography>
      <Button
        label="Unblock"
        variant="outline"
        onPress={() => handleUnblock(item.blockedId, item.blocked.name)}
        style={styles.unblockBtn}
      />
    </View>
  );

  if (error) return <ErrorState message="Could not load blocked users" onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={blocked}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        contentContainerStyle={blocked.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState title="No Blocked Users" subtitle="Users you block will appear here" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  row: {
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
  name: { flex: 1 },
  unblockBtn: { paddingHorizontal: spacing[3] },
});
