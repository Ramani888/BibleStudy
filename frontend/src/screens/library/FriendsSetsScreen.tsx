import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState } from '../../components/feedback';
import { Screen, ScreenHeader, Spacer, Typography } from '../../components/ui';
import { CopyIcon } from '../../components/icons';

import { useCloneSet, useFriendsSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FriendsSetsScreen({ navigation }: LibraryScreenProps<'FriendsSets'>) {
  const { colors } = useTheme();
  const screenEdges = ['top', 'bottom'] as const;
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

  const sets = useMemo(() => data?.pages.flatMap(p => p.sets) ?? [], [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const renderSetItem = useCallback(({ item }: { item: StudySet }) => (
    <SetCard
      set={item}
      onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title, isOwner: false })}
      onMenuPress={() => setSelectedSet(item)}
    />
  ), [navigation]);

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const closeSelectedSet = useCallback(() => setSelectedSet(null), []);

  const header = <ScreenHeader title="Friends' Sets" onBack={handleGoBack} />;
  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Typography preset="caption" color={colors.textSecondary} align="center">
        {total} {total === 1 ? 'set' : 'sets'} shared by friends
      </Typography>
    </View>
  );

  if (isError) {
    return (
      <Screen header={header} edges={screenEdges}>
        <ErrorState message="Could not load friends' sets." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={footer} edges={screenEdges}>
      <View style={styles.flex}>
      <FlatList
        data={isLoading ? [] : sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => <Spacer size={spacing.md} />}
        ListEmptyComponent={
          <EmptyState
            title="No sets from friends"
            subtitle="When your friends mark sets as Friends-only, they'll appear here."
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
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge, flexGrow: 1 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});
