import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState } from '../../components/feedback';
import { Screen, ScreenHeader, SearchBar, Spacer, Typography } from '../../components/ui';
import { CopyIcon, SearchIcon } from '../../components/icons';

import { useCloneSet, useFriendsSets, useSearchToggle } from '../../hooks';

const ICON_SIZE = 20;
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FriendsSetsScreen({ navigation }: LibraryScreenProps<'FriendsSets'>) {
  const { colors } = useTheme();
  const { mutate: cloneSet } = useCloneSet();
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFriendsSets();

  const sets = useMemo(() => data?.pages.flatMap(p => p.sets) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const filteredSets = useMemo(() => {
    if (!search.trim()) return sets;
    const q = search.trim().toLowerCase();
    return sets.filter(s => s.title.toLowerCase().includes(q));
  }, [sets, search]);

  const renderSetItem = useCallback(({ item }: { item: StudySet }) => (
    <SetCard
      set={item}
      onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: false })}
      onMenuPress={() => setSelectedSet(item)}
    />
  ), [navigation]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const closeSelectedSet = useCallback(() => setSelectedSet(null), []);

  const header = (
    <ScreenHeader
      title="Friends' Sets"
      onBack={handleGoBack}
      right={
        <Pressable onPress={toggleSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
          <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.accent : colors.textSecondary} />
        </Pressable>
      }
    />
  );
  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Typography preset="caption" color={colors.textSecondary} align="center">
        {total} {total === 1 ? 'set' : 'sets'} shared by friends
      </Typography>
    </View>
  );

  if (isError) {
    return (
      <Screen header={header}>
        <ErrorState message="Could not load friends' sets." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={footer}>
      {searchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search sets…" autoFocus />
        </View>
      )}
      <View style={styles.flex}>
      <FlatList
        data={isLoading ? [] : filteredSets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        onEndReached={() => !search && hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <Spacer size={spacing.md} />}
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No results' : 'No sets from friends'}
            subtitle={search ? `No sets match "${search}"` : "When your friends mark sets as Friends-only, they'll appear here."}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.accent} size="small" />
            </View>
          ) : null
        }
        renderItem={renderSetItem}
      />

      </View>

      <ActionSheet
        visible={!!selectedSet}
        title={selectedSet?.title}
        onClose={closeSelectedSet}
        actions={[
          {
            label: 'Clone to Library',
            icon: CopyIcon,
            onPress: () =>
              selectedSet &&
              cloneSet(selectedSet.id, {
                onSuccess: () => {
                  setSelectedSet(null);
                  Toast.show({ type: 'success', text1: 'Set cloned to your library!' });
                },
                onError: err =>
                  Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
              }),
          },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md },
  iconPressed: { opacity: 0.85 },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge, flexGrow: 1 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});
