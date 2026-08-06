import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ClockIcon, UserPlusIcon } from '../../components/icons';
import { useSearchUsers, useSendFriendRequest } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { UserProfile } from '../../types/friends.types';

type Props = ProfileScreenProps<'SearchUsers'>;

export function SearchUsersScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { data: users = [], isFetching } = useSearchUsers(debouncedQuery);
  const sendRequest = useSendFriendRequest();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
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
      <View style={styles.userRow}>
        <Pressable
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        >
          <Avatar uri={item.profileImage ?? null} name={item.name ?? ''} size="sm" />
          <View>
            <Typography preset="label">{item.name}</Typography>
            {item.church ? (
              <Typography preset="caption" color={colors.textSecondary}>{item.church}</Typography>
            ) : null}
          </View>
        </Pressable>
        {isFriend ? (
          <CheckCircleIcon size={24} color={colors.success} />
        ) : isPending ? (
          <ClockIcon size={24} color={colors.textSecondary} />
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
      </View>
    );
  }, [sentIds, handleAdd, navigation, sendRequest.isPending, colors, styles]);

  return (
    <Screen
      header={<ScreenHeader title="Find Friends" onBack={() => navigation.goBack()} />}
    >
      <View style={styles.searchBar}>
        <Input
          placeholder="Search by name..."
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
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          debouncedQuery.length > 1 && !isFetching ? (
            <View style={styles.empty}>
              <Typography preset="body" color={colors.textSecondary}>No users found</Typography>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    searchBar: { padding: layout.screenPaddingH },
    list: { paddingHorizontal: layout.screenPaddingH },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[3],
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
    addBtn: { padding: spacing[1] },
    loader: { paddingVertical: spacing[2] },
    empty: { padding: layout.screenPaddingH, alignItems: 'center' },
  });
}
