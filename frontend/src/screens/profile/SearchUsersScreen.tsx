import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { SearchBar } from '../../components/ui/SearchBar';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ClockIcon, UserPlusIcon } from '../../components/icons';
import { useSearchUsers, useSendFriendRequest } from '../../hooks/useFriends';
import { useDebouncedValue } from '../../hooks';
import { getErrorMessage } from '../../api/client';
import type { UserProfile } from '../../types/friends.types';

type Props = ProfileScreenProps<'SearchUsers'>;

export function SearchUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { data: users = [], isFetching } = useSearchUsers(debouncedQuery);
  const sendRequest = useSendFriendRequest();

  React.useEffect(() => {
    if (!isFetching) setSentIds(new Set());
  }, [isFetching]);

  const handleAdd = useCallback((user: UserProfile) => {
    sendRequest.mutate(user.id, {
      onSuccess: () => {
        setSentIds(prev => new Set(prev).add(user.id));
        Toast.show({ type: 'success', text1: `Friend request sent to ${user.name}` });
      },
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  }, [sendRequest]);

  const renderItem = useCallback(({ item }: { item: UserProfile }) => {
    const isFriend = !!item.isFriend;
    const isPending = !!item.pendingRequest || sentIds.has(item.id);
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
      >
        <Avatar uri={item.profileImage ?? null} name={item.name ?? ''} size="sm" />
        <View style={styles.cardInfo}>
          <Typography preset="label" numberOfLines={1}>{item.name}</Typography>
          {item.church ? (
            <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>
              {item.church}
            </Typography>
          ) : null}
        </View>
        {isFriend ? (
          <CheckCircleIcon size={22} color={colors.success} />
        ) : isPending ? (
          <View style={styles.pendingBadge}>
            <ClockIcon size={14} color={colors.textSecondary} />
            <Typography preset="caption" color={colors.textSecondary}>Sent</Typography>
          </View>
        ) : (
          <Pressable
            style={styles.addBtn}
            onPress={() => handleAdd(item)}
            hitSlop={8}
            disabled={sendRequest.isPending}
          >
            <UserPlusIcon size={20} color={colors.primary} />
          </Pressable>
        )}
      </Pressable>
    );
  }, [sentIds, handleAdd, navigation, sendRequest.isPending, colors, styles]);

  return (
    <Screen header={<ScreenHeader title="Find Friends" onBack={() => navigation.goBack()} />}>
      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search by name or email…"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>

      {isFetching && debouncedQuery.length > 1 && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      )}

      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        extraData={sentIds}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          debouncedQuery.length > 1 && !isFetching ? (
            <EmptyState title="No users found" subtitle={`No results for "${debouncedQuery}"`} />
          ) : debouncedQuery.length === 0 ? (
            <EmptyState title="Find Friends" subtitle="Search by name or email to connect with others." />
          ) : null
        }
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    searchWrap: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
    list: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing[6] },
    separator: { height: spacing[2] },
    loader: { paddingVertical: spacing[2] },
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
    addBtn: { padding: spacing[1] },
    pendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: layout.pillRadius,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
