import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useFriends } from '../../hooks/useFriends';
import { useGroup, useAddGroupMember } from '../../hooks/useGroups';
import { getErrorMessage } from '../../api/client';
import type { Friendship } from '../../types/friends.types';

type Props = ProfileScreenProps<'AddGroupMember'>;

export function AddGroupMemberScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { groupId } = route.params;

  const { data: friends = [], isLoading: loadingFriends } = useFriends();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const addMember = useAddGroupMember();

  if (loadingFriends || loadingGroup) return <LoadingOverlay visible />;

  const memberIds = new Set(group?.members?.map(m => m.userId) ?? []);
  const eligible = friends.filter(f => !memberIds.has(f.friend.id));

  const handleAdd = (friend: Friendship) => {
    addMember.mutate(
      { groupId, userId: friend.friend.id },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: `${friend.friend.name} added to group` });
          navigation.goBack();
        },
        onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
      },
    );
  };

  const renderItem = ({ item }: { item: Friendship }) => (
    <View style={styles.row}>
      <Avatar uri={item.friend.profileImage ?? null} name={item.friend.name ?? ''} size="md" />
      <View style={styles.info}>
        <Typography preset="label">{item.friend.name}</Typography>
        {item.friend.church ? (
          <Typography preset="caption" color={colors.textSecondary}>{item.friend.church}</Typography>
        ) : null}
      </View>
      <Button
        label="Add"
        variant="outline"
        onPress={() => handleAdd(item)}
        loading={addMember.isPending}
        style={styles.addBtn}
      />
    </View>
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title="Add Member"
          onBack={() => navigation.goBack()}
        />
      }
    >
      <FlatList
        data={eligible}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={eligible.length === 0 ? styles.emptyContainer : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            title="No Friends to Add"
            subtitle="All your friends are already in this group, or you have no friends yet."
          />
        }
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof import('../../theme').useTheme>['colors']) {
  return StyleSheet.create({
    list: { padding: layout.screenPaddingH },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    separator: { height: spacing[2] },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingVertical: spacing[2],
    },
    info: { flex: 1, gap: spacing[0.5] },
    addBtn: { minWidth: 72 },
  });
}
