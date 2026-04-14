import React, { useEffect, useState } from 'react';
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
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { usePublicGroups, useJoinGroup } from '../../hooks/useGroups';
import { getErrorMessage } from '../../api/client';
import type { Group } from '../../types/groups.types';

type Props = ProfileScreenProps<'PublicGroups'>;

export function PublicGroupsScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { data, isFetching, error, refetch } = usePublicGroups(debouncedQuery || undefined);
  const joinGroup = useJoinGroup();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const groups = data?.groups ?? [];

  const handleJoin = (group: Group) => {
    joinGroup.mutate(group.inviteCode, {
      onSuccess: () => {
        Toast.show({ type: 'success', text1: `Joined "${group.name}"` });
        navigation.navigate('GroupDetail', { groupId: group.id });
      },
      onError: (e) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
    });
  };

  const renderItem = ({ item }: { item: Group }) => (
    <Pressable
      style={styles.groupRow}
      onPress={() => handleJoin(item)}
    >
      <View style={styles.groupIcon}>
        <Icon name="people" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Typography preset="body">{item.name}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {item._count?.members ?? 0} members
        </Typography>
      </View>
      <Icon name="enter-outline" size={20} color={colors.primary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchBar}>
        <Input
          placeholder="Search public groups..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      {error && <ErrorState message="Could not load public groups" onRetry={refetch} />}
      {isFetching && !error && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      )}
      {!error && (
      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={isFetching}
        onRefresh={refetch}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          !isFetching ? (
            <EmptyState
              title="No Public Groups"
              subtitle="No public groups found. Try a different search."
            />
          ) : null
        }
      />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { padding: layout.screenPaddingH },
  loader: { paddingVertical: spacing[2] },
  list: { paddingHorizontal: layout.screenPaddingH },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
});
