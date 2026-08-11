import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { ListCard } from '../../components/ui/ListCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useBlockedUsers, useUnblockUser } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { BlockedUser } from '../../types/friends.types';

type Props = ProfileScreenProps<'BlockedUsers'>;

export function BlockedUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { data: blocked = [], isFetching, error, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();

  const handleUnblock = (userId: string, name: string) => {
    unblock.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} unblocked` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <ListCard
      leading={<Avatar uri={item.blocked.profileImage ?? null} name={item.blocked.name ?? ''} size="sm" />}
      title={item.blocked.name}
      trailing={
        <Button
          label="Unblock"
          variant="outline"
          onPress={() => handleUnblock(item.blockedId, item.blocked.name)}
          style={styles.unblockBtn}
        />
      }
    />
  );

  if (error) return <ErrorState message="Could not load blocked users" onRetry={refetch} />;

  return (
    <Screen
      header={<ScreenHeader title="Blocked Users" onBack={() => navigation.goBack()} />}
    >
      <View style={styles.fill}>
      <FlatList
        data={blocked}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={blocked.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState title="No Blocked Users" subtitle="Users you block will appear here" />
        }
      />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: layout.screenPaddingH },
  separator: { height: spacing.md },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  unblockBtn: { paddingHorizontal: spacing.md },
});
