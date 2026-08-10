import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState, ErrorState } from '../../components/feedback';
import { Screen, ScreenHeader, Spacer, Typography } from '../../components/ui';
import { CopyIcon } from '../../components/icons';

import { useCloneSet, useFriendsSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FriendsSetsScreen({ navigation }: LibraryScreenProps<'FriendsSets'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors, spacing } = theme;
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

  const header = <ScreenHeader title="Friends' Sets" onBack={() => navigation.goBack()} />;
  const footer = (
    <View style={styles.footer}>
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
      <View style={{ flex: 1 }}>
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
          <EmptyState
            title="No sets from friends"
            subtitle="When your friends mark sets as Friends-only, they'll appear here."
          />
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

      </View>

      <ActionSheet
        visible={!!selectedSet}
        title={selectedSet?.title}
        onClose={() => setSelectedSet(null)}
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

const makeStyles = ({ colors, layout, spacing }: Theme) =>
  StyleSheet.create({
    list: { padding: layout.screenPaddingH, paddingBottom: spacing[10], flexGrow: 1 },
    footer: {
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
  });
