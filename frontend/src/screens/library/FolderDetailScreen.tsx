import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetCard } from '../../components/domain';
import { ActionSheet, EmptyState } from '../../components/feedback';
import { Input, Spacer, Typography } from '../../components/ui';
import { useFolders, useSets, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const { folderId } = route.params;
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: folders = [] } = useFolders();
  const { data: sets = [], isLoading, refetch } = useSets(folderId);
  const { mutate: deleteSet } = useDeleteSet();

  const folderColor = folders.find(f => f.id === folderId)?.color ?? null;

  const toggleSearch = () => {
    if (searchVisible) setSearch('');
    setSearchVisible(v => !v);
  };

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sets;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {folderColor && <View style={[styles.colorBar, { backgroundColor: folderColor }]} />}
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
        </Typography>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleSearch} hitSlop={8}>
            <Typography preset="label" color={searchVisible ? colors.primary : colors.textSecondary}>🔍</Typography>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('CreateSet', { folderId })} hitSlop={8}>
            <Typography preset="label" color={colors.primary}>+ New Set</Typography>
          </Pressable>
        </View>
      </View>
      {searchVisible && (
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search sets…"
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            autoFocus
          />
        </View>
      )}

      <FlatList
        data={filteredSets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title={search ? 'No results' : 'No sets in this folder'}
              subtitle={search ? `No sets match "${search}"` : 'Create a set and assign it to this folder'}
              ctaLabel={search ? undefined : 'New Set'}
              onCta={search ? undefined : () => navigation.navigate('CreateSet', { folderId })}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <SetCard
            set={item}
            onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
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
            label: '📖 Study Set',
            onPress: () =>
              selectedSet &&
              navigation.navigate('Study', { setId: selectedSet.id, setTitle: selectedSet.title }),
          },
          {
            label: '➕ Create Card',
            onPress: () => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id }),
          },
          {
            label: '✏️ Edit',
            onPress: () => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id }),
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
  colorBar: { height: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3] },
  searchInput: { marginBottom: 0 },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
});
