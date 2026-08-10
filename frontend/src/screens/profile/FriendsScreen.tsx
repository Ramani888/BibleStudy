import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { UserMinusIcon, UserPlusIcon, BellIcon, TrophyIcon } from '../../components/icons';
import { useFriends, useRemoveFriend } from '../../hooks/useFriends';
import { useLeaderboard } from '../../hooks';
import type { Friendship } from '../../types/friends.types';
import { getErrorMessage } from '../../api/client';

type Props = ProfileScreenProps<'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { data: friends = [], isFetching, error, refetch } = useFriends();
  const { data: leaderboard = [] } = useLeaderboard();
  const removeFriend = useRemoveFriend();

  const streakMap = useMemo(
    () => new Map(leaderboard.map(e => [e.userId, e.streak])),
    [leaderboard],
  );

  const handleRemove = (friendId: string, name: string) => {
    removeFriend.mutate(friendId, {
      onSuccess: () => Toast.show({ type: 'success', text1: `${name} removed` }),
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: Friendship }) => {
    const streak = streakMap.get(item.friendId) ?? 0;
    const subtitle = streak > 0
      ? `🔥 ${streak} day streak`
      : (item.friend.church ?? undefined);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('UserProfile', { userId: item.friendId })}
      >
        <Avatar uri={item.friend.profileImage ?? null} name={item.friend.name ?? ''} size="sm" />
        <View style={styles.cardInfo}>
          <Typography preset="label" numberOfLines={1}>{item.friend.name}</Typography>
          {subtitle ? (
            <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
        <Pressable
          onPress={() => handleRemove(item.friendId, item.friend.name)}
          hitSlop={8}
          style={styles.removeBtn}
        >
          <UserMinusIcon size={18} color={colors.textDisabled} />
        </Pressable>
      </Pressable>
    );
  };

  if (error) return <ErrorState message="Could not load friends" onRetry={refetch} />;

  return (
    <Screen
      header={
        <ScreenHeader
          title={`Friends${friends.length > 0 ? ` (${friends.length})` : ''}`}
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
    >
      <View style={{ flex: 1 }}>
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
      </View>
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: spacing[3] },
    list: { padding: layout.screenPaddingH, paddingBottom: spacing[6] },
    separator: { height: spacing[2] },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[3],
      borderRadius: layout.cardRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    cardInfo: { flex: 1, gap: spacing[0.5] },
    removeBtn: { padding: spacing[1] },
  });
}
