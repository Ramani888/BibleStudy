import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { useSearchUsers, useSendFriendRequest } from '../../hooks/useFriends';
import { getErrorMessage } from '../../api/client';
import type { UserProfile } from '../../types/friends.types';

type Props = ProfileScreenProps<'SearchUsers'>;

export function SearchUsersScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const { data: users = [], isFetching } = useSearchUsers(debouncedQuery);
  const sendRequest = useSendFriendRequest();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Clear local sent-IDs when search results refresh with updated data so the
  // server-returned pendingRequest field takes over as the source of truth.
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
            <Typography preset="body">{item.name}</Typography>
            {item.church ? (
              <Typography preset="caption" color={colors.textSecondary}>{item.church}</Typography>
            ) : null}
          </View>
        </Pressable>
        {isFriend ? (
          <Icon name="checkmark-circle" size={24} color={colors.success} />
        ) : isPending ? (
          <Icon name="time-outline" size={24} color={colors.textSecondary} />
        ) : (
          <Pressable
            style={styles.addBtn}
            onPress={() => handleAdd(item)}
            hitSlop={8}
            disabled={sendRequest.isPending}
          >
            <Icon name="person-add-outline" size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>
    );
  }, [sentIds, handleAdd, navigation, sendRequest.isPending]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          debouncedQuery.length > 1 && !isFetching ? (
            <View style={styles.empty}>
              <Typography preset="body" color={colors.textSecondary}>No users found</Typography>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
