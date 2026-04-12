import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState } from '../../components/feedback';
import { Spacer, Typography } from '../../components/ui';
import { useSets, useDeleteSet, useCloneSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const { folderId } = route.params;
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);

  const { data: sets = [], isLoading, refetch } = useSets(folderId);
  const { mutate: deleteSet } = useDeleteSet();
  const { mutate: cloneSet } = useCloneSet();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
        </Typography>
        <Pressable onPress={() => navigation.navigate('CreateSet', { folderId })} hitSlop={8}>
          <Typography preset="label" color={colors.primary}>+ New Set</Typography>
        </Pressable>
      </View>

      <FlatList
        data={sets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No sets in this folder"
              subtitle="Create a set and assign it to this folder"
              ctaLabel="New Set"
              onCta={() => navigation.navigate('CreateSet', { folderId })}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <SetCard
            set={item}
            onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
            onLongPress={() => setSelectedSet(item)}
          />
        )}
      />

      <ActionSheet
        visible={!!selectedSet}
        title={selectedSet?.title}
        onClose={() => setSelectedSet(null)}
        actions={[
          {
            label: '✏️ Edit',
            onPress: () => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id }),
          },
          {
            label: '📋 Clone',
            onPress: () =>
              selectedSet &&
              cloneSet(selectedSet.id, {
                onSuccess: () => Toast.show({ type: 'success', text1: 'Set cloned' }),
                onError: err => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
              }),
          },
          {
            label: '🗑 Delete',
            destructive: true,
            onPress: () =>
              selectedSet &&
              Alert.alert('Delete Set', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    deleteSet(selectedSet.id, {
                      onSuccess: () => Toast.show({ type: 'success', text1: 'Set deleted' }),
                      onError: err => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
                    }),
                },
              ]),
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
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
});
