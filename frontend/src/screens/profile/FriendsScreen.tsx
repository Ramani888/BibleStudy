import React from 'react';
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
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useFriends, useRemoveFriend } from '../../hooks/useFriends';
import type { Friendship } from '../../types/friends.types';
import { getErrorMessage } from '../../api/client';

type Props = ProfileScreenProps<'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const { data: friends = [], isLoading, refetch } = useFriends();
  const removeFriend = useRemoveFriend();

  const handleRemove = (friendId: string, name: string) => {
    removeFriend.mutate(friendId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} removed` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: Friendship }) => (
    <Pressable
      style={styles.friendRow}
      onPress={() => navigation.navigate('UserProfile', { userId: item.friendId })}
    >
      <View style={styles.avatar}>
        <Icon name="person" size={20} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Typography preset="body">{item.friend.name}</Typography>
        {item.friend.church ? (
          <Typography preset="caption" color={colors.textSecondary}>{item.friend.church}</Typography>
        ) : null}
      </View>
      <Pressable onPress={() => handleRemove(item.friendId, item.friend.name)} hitSlop={8}>
        <Icon name="person-remove-outline" size={20} color={colors.error} />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.actions}>
        <Button
          label="Find Friends"
          variant="outline"
          onPress={() => navigation.navigate('SearchUsers')}
          style={styles.actionBtn}
        />
        <Button
          label="Requests"
          variant="outline"
          onPress={() => navigation.navigate('FriendRequests')}
          style={styles.actionBtn}
        />
      </View>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={friends.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No Friends Yet"
            subtitle="Search for people to add as friends"
            ctaLabel="Find Friends"
            onCta={() => navigation.navigate('SearchUsers')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: layout.screenPaddingH,
  },
  actionBtn: { flex: 1 },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  friendRow: {
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
});
