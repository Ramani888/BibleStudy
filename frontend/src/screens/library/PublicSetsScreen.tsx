import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { EmptyState, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { Spacer, Typography } from '../../components/ui';
import { usePublicSets, useCloneSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function PublicSetsScreen({ navigation }: LibraryScreenProps<'PublicSets'>) {
  const { mutate: cloneSet } = useCloneSet();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicSets();

  const sets = data?.pages.flatMap(p => p.sets) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  if (isError) return <ErrorState message="Could not load public sets." onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {total} public {total === 1 ? 'set' : 'sets'} available
        </Typography>
      </View>

      <FlatList
        data={isLoading ? [] : sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        onEndReached={() => hasNextPage && fetchNextPage()}
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
            onPress={() =>
              navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })
            }
            onLongPress={() =>
              cloneSet(item.id, {
                onSuccess: () =>
                  Toast.show({ type: 'success', text1: 'Set cloned to your library!' }),
                onError: err =>
                  Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
              })
            }
          />
        )}
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
