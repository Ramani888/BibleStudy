import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState } from '../../components/feedback';
import { Screen, ScreenHeader, SearchBar, Spacer, Typography } from '../../components/ui';
import { CopyIcon, SearchIcon } from '../../components/icons';

import { useCloneSet, useDebouncedValue, usePublicSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, layout } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;

export function PublicSetsScreen({ navigation }: LibraryScreenProps<'PublicSets'>) {
  const { colors, spacing: sp } = useTheme();
  const screenEdges = ['top', 'bottom'] as const;
    ? ['top' as const]
    : ['top' as const, 'bottom' as const];
  const { mutate: cloneSet } = useCloneSet();
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const {
    data,
    isLoading,
    isRefetching,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicSets(debouncedSearch || undefined);

  const sets = useMemo(() => data?.pages.flatMap(p => p.sets) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const renderSetItem = useCallback(({ item }: { item: StudySet }) => (
    <SetCard
      set={item}
      onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: false })}
      onMenuPress={() => setSelectedSet(item)}
    />
  ), [navigation]);

  const toggleSearch = useCallback(() => {
    if (searchVisible) setSearch('');
    setSearchVisible(v => !v);
  }, [searchVisible]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const closeSelectedSet = useCallback(() => setSelectedSet(null), []);

  const countText = (isFetching && !isLoading && !isRefetching && !isFetchingNextPage)
    ? 'Searching…'
    : debouncedSearch
      ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedSearch}"`
      : `${total} public ${total === 1 ? 'set' : 'sets'} available`;

  const header = (
    <ScreenHeader
      title="Browse Public Sets"
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
      <Typography preset="caption" color={colors.textSecondary} align="center">{countText}</Typography>
    </View>
  );

  if (isError) {
    return (
      <Screen header={header} edges={screenEdges}>
        <ErrorState message="Could not load public sets." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={footer} edges={screenEdges}>
      <View>
        {searchVisible && (
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder="Search public sets…"
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchInput}
              autoFocus
            />
          </View>
        )}
      </View>

      <View style={styles.flex}>
      <FlatList
        data={isLoading ? [] : sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <Spacer size={sp.md} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState title="No public sets yet" subtitle="Be the first to publish a set!" />
          ) : null
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
  iconPressed: { opacity: 0.85 },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md },
  searchInput: { marginBottom: 0 },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge, flexGrow: 1 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});
