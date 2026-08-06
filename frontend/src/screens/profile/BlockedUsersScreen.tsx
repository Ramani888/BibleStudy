import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
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
  const styles = makeStyles(colors);
  const { data: blocked = [], isFetching, error, refetch } = useBlockedUsers();
  const unblock = useUnblockUser();

  const handleUnblock = (userId: string, name: string) => {
    unblock.mutate(userId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} unblocked` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={styles.row}>
      <Avatar uri={item.blocked.profileImage ?? null} name={item.blocked.name ?? ''} size="sm" />
      <Typography preset="label" style={styles.name}>{item.blocked.name}</Typography>
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
    <Screen
      header={<ScreenHeader title="Blocked Users" onBack={() => navigation.goBack()} />}
    >
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
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    list: { paddingHorizontal: layout.screenPaddingH },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[3],
      paddingHorizontal: layout.screenPaddingH,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing[3],
    },
    name: { flex: 1 },
    unblockBtn: { paddingHorizontal: spacing[3] },
  });
}
