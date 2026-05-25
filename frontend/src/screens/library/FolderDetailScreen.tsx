import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { SetActionSheet, SetCard } from '../../components/domain';
import { AppModal, ConfirmDialog, EmptyState, ErrorState, SetCardSkeleton } from '../../components/feedback';
import { Divider, Input, Spacer, Typography } from '../../components/ui';

import { useConfirmDialog, useFolderModal, useFolders, useSets, useDeleteSet, useUpdateSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const { folderId, folderColor } = route.params;
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [assignTargetSetId, setAssignTargetSetId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: sets = [], isLoading, isRefetching, isError, refetch } = useSets(folderId);
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet();
  const { data: allFolders = [] } = useFolders();
  const { show, dialogProps } = useConfirmDialog();
  const folderModal = useFolderModal();

  const cachedFolderName = allFolders.find(f => f.id === folderId)?.name;
  useEffect(() => {
    if (cachedFolderName) navigation.setOptions({ title: cachedFolderName });
  }, [cachedFolderName, navigation]);

  const toggleSearch = () => {
    if (searchVisible) setSearch('');
    setSearchVisible(v => !v);
  };

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.trim().toLowerCase()))
    : sets;

  const handleAssignFolder = (newFolderId: string | null) => {
    if (!assignTargetSetId) return;
    updateSet({ id: assignTargetSetId, payload: { folderId: newFolderId } }, {
      onSuccess: () => {
        folderModal.closeAssignModal();
        setAssignTargetSetId(null);
        Toast.show({ type: 'success', text1: newFolderId ? 'Moved to folder' : 'Removed from folder' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  };

  const handleDeleteSet = (set: StudySet) => {
    show({
      title: 'Delete Set',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(set.id);
          Toast.show({ type: 'success', text1: 'Set deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
        }
      },
    });
  };

  if (isError) return <ErrorState message="Could not load sets." onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {folderColor && <View style={[styles.colorBar, { backgroundColor: folderColor }]} />}
      <View style={styles.header}>
        <Typography preset="bodySm" color={colors.textSecondary}>
          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
        </Typography>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleSearch} hitSlop={8}>
            <Icon name="search-outline" size={ICON_SIZE} color={searchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('CreateSet', { folderId })} hitSlop={8} style={styles.newSetBtn}>
            <Icon name="add" size={ICON_SIZE} color={colors.primary} />
            <Typography preset="label" color={colors.primary}>New Set</Typography>
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
        refreshing={isRefetching}
        onRefresh={refetch}
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
              title={search ? 'No results' : 'No sets in this folder'}
              subtitle={search ? `No sets match "${search}"` : 'Create a set and assign it to this folder'}
              ctaLabel={search ? undefined : 'New Set'}
              onCta={search ? undefined : () => navigation.navigate('CreateSet', { folderId })}
            />
          )
        }
        renderItem={({ item }) => (
          <SetCard
            set={item}
            onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
            onMenuPress={() => setSelectedSet(item)}
          />
        )}
      />

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => { setSelectedSet(null); setAssignTargetSetId(null); }}
        onStudy={() =>
          selectedSet &&
          navigation.navigate('Study', { setId: selectedSet.id, setTitle: selectedSet.title })
        }
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        onAssignFolder={() => {
          if (selectedSet) setAssignTargetSetId(selectedSet.id);
          folderModal.openAssignModal();
        }}
        onEdit={() => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id })}
        onDelete={() => selectedSet && handleDeleteSet(selectedSet)}
      />

      <AppModal
        visible={folderModal.assignFolderOpen}
        title="Move to Folder"
        onClose={() => { folderModal.closeAssignModal(); setAssignTargetSetId(null); }}
      >
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.setOption} onPress={() => handleAssignFolder(null)}>
            <Typography preset="body" color={colors.textSecondary}>No Folder</Typography>
          </Pressable>
          <Divider marginV={spacing[1]} />
          {allFolders.filter(f => f.id !== folderId).map(f => (
            <React.Fragment key={f.id}>
              <Pressable style={styles.setOption} onPress={() => handleAssignFolder(f.id)}>
                <Typography preset="body">{f.name}</Typography>
              </Pressable>
              <Divider marginV={spacing[1]} />
            </React.Fragment>
          ))}
        </ScrollView>
      </AppModal>

      <ConfirmDialog {...dialogProps} />
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
  newSetBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  setOption: { paddingVertical: spacing[3] },
});
