import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { layout, spacing, useTheme } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { LogOutIcon, UsersIcon } from '../../components/icons';
import { usePublicGroups, useJoinGroup } from '../../hooks/useGroups';
import { getErrorMessage } from '../../api/client';
import type { Group } from '../../types/groups.types';

type Props = ProfileScreenProps<'PublicGroups'>;

export function PublicGroupsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
    <Pressable style={styles.groupRow} onPress={() => handleJoin(item)}>
      <View style={styles.groupIcon}>
        <UsersIcon size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Typography preset="label">{item.name}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {item._count?.members ?? 0} members
        </Typography>
      </View>
      <LogOutIcon size={20} color={colors.primary} />
    </Pressable>
  );

  return (
    <Screen
      header={<ScreenHeader title="Discover Groups" onBack={() => navigation.goBack()} />}
    >
      <View style={styles.searchBar}>
        <Input placeholder="Search public groups..." value={query} onChangeText={setQuery} autoFocus />
      </View>
      {isFetching && (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      )}
      {error ? (
        <ErrorState message="Could not load public groups" onRetry={refetch} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshing={isFetching}
          onRefresh={refetch}
          contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            !isFetching ? (
              <EmptyState title="No Public Groups" subtitle="No public groups found. Try a different search." />
            ) : null
          }
        />
      )}
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    searchBar: { padding: layout.screenPaddingH },
    loader: { paddingVertical: spacing[2] },
    list: { paddingHorizontal: layout.screenPaddingH },
    emptyContainer: { flex: 1, justifyContent: 'center' },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[3],
      paddingHorizontal: layout.screenPaddingH,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing[3],
    },
    groupIcon: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.primarySurface,
      alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1 },
  });
}
