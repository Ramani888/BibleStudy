import React from 'react';
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
import { UserMinusIcon, UserPlusIcon, BellIcon, TrophyIcon } from '../../components/icons';
import { useFriends, useRemoveFriend } from '../../hooks/useFriends';
import type { Friendship } from '../../types/friends.types';
import { getErrorMessage } from '../../api/client';

type Props = ProfileScreenProps<'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { data: friends = [], isFetching, error, refetch } = useFriends();
  const removeFriend = useRemoveFriend();

  const handleRemove = (friendId: string, name: string) => {
    removeFriend.mutate(friendId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} removed` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: Friendship }) => (
    <ListCard
      leading={<Avatar uri={item.friend.profileImage ?? null} name={item.friend.name ?? ''} size="sm" />}
      title={item.friend.name}
      subtitle={item.friend.church ?? undefined}
      trailing={
        <Pressable onPress={() => handleRemove(item.friendId, item.friend.name)} hitSlop={8}>
          <UserMinusIcon size={20} color={colors.error} />
        </Pressable>
      }
      onPress={() => navigation.navigate('UserProfile', { userId: item.friendId })}
    />
  );

  if (error) return <ErrorState message="Could not load friends" onRetry={refetch} />;

  return (
    <Screen
      header={
        <ScreenHeader
          title="Friends"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <Pressable onPress={() => navigation.navigate('Leaderboard')} hitSlop={8}>
                <TrophyIcon size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('SearchUsers')} hitSlop={8}>
                <UserPlusIcon size={22} color={colors.primary} />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('FriendRequests')} hitSlop={8}>
                <BellIcon size={22} color={colors.primary} />
              </Pressable>
            </View>
          }
        />
      }
      footer={
        <View style={styles.footer}>
          <Typography preset="caption" color={colors.textSecondary}>
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
          </Typography>
        </View>
      }
    >
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: spacing[3] },
    list: { padding: layout.screenPaddingH },
    separator: { height: spacing[3] },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    footer: {
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
  });
}
