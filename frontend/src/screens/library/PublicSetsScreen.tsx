import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { Input, Spacer, Typography } from '../../components/ui';

import { usePublicSets, useCloneSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;

export function PublicSetsScreen({ navigation }: LibraryScreenProps<'PublicSets'>) {
  const { mutate: cloneSet } = useCloneSet();
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

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

  const sets = data?.pages.flatMap(p => p.sets) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const toggleSearch = () => {
    if (searchVisible) setSearch('');
    setSearchVisible(v => !v);
  };

  if (isError) return <ErrorState message="Could not load public sets." onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {(isFetching && !isLoading && !isRefetching && !isFetchingNextPage)
            ? 'Searching…'
            : debouncedSearch
              ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedSearch}"`
              : `${total} public ${total === 1 ? 'set' : 'sets'} available`}
        </Typography>
        <Pressable onPress={toggleSearch} hitSlop={8}>
          <Icon name="search-outline" size={ICON_SIZE} color={searchVisible ? colors.primary : colors.textSecondary} />
        </Pressable>
      </View>
      {searchVisible && (
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search public sets…"
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={isLoading ? [] : sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState title="No public sets yet" subtitle="Be the first to publish a set!" />
          ) : (
            <>
              <SetCardSkeleton />
              <SetCardSkeleton />
              <SetCardSkeleton />
            </>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <SetCard
            set={item}
            onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: false })}
            onMenuPress={() => setSelectedSet(item)}
          />
        )}
      />

      <ActionSheet
        visible={!!selectedSet}
        title={selectedSet?.title}
        onClose={() => setSelectedSet(null)}
        actions={[
          {
            label: 'Clone to Library',
            iconName: 'copy-outline',
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3] },
  searchInput: { marginBottom: 0 },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10], flexGrow: 1 },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
});
