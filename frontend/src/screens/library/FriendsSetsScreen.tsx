import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { Spacer, Typography } from '../../components/ui';

import { useCloneSet, useFriendsSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FriendsSetsScreen({ navigation }: LibraryScreenProps<'FriendsSets'>) {
  const { mutate: cloneSet } = useCloneSet();
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);

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

  const sets = data?.pages.flatMap(p => p.sets) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  if (isError) return <ErrorState message="Could not load friends' sets." onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {total} {total === 1 ? 'set' : 'sets'} shared by friends
        </Typography>
      </View>

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
          isLoading ? (
            <>
              <SetCardSkeleton />
              <SetCardSkeleton />
              <SetCardSkeleton />
            </>
          ) : (
            <EmptyState
              title="No sets from friends"
              subtitle="When your friends mark sets as Friends-only, they'll appear here."
            />
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
            onPress={() =>
              navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: false })
            }
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
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10], flexGrow: 1 },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
});
