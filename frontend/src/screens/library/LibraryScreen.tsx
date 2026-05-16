import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { FolderCard, SetActionSheet, SetCard } from '../../components/domain';
import { ActionSheet, AppModal, ConfirmDialog, EmptyState, SetCardSkeleton } from '../../components/feedback';
import { Button, ColorPicker, Divider, Input, Spacer, Typography } from '../../components/ui';

const ICON_SIZE = 20;
import {
  useConfirmDialog,
  useFolders,
  useSets,
  useDeleteSet,
  useUpdateSet,
  useDeleteFolder,
  useFolderModal,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

type Tab = 'sets' | 'folders';
type SortOrder = 'newest' | 'alpha' | 'cards';

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const [search, setSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sets');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } = useFolders();
  const { data: sets = [], isLoading: setsLoading, refetch: refetchSets } = useSets();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet(selectedSet?.id ?? '');
  const { show, dialogProps } = useConfirmDialog();
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();

  const folderModal = useFolderModal(selectedFolder);

  const refreshing = foldersLoading || setsLoading;

  const toggleSearch = () => {
    if (searchVisible) setSearch('');
    setSearchVisible(v => !v);
  };

  const cycleSortOrder = () =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'cards' : 'newest');

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sets;

  const sortedSets = [...filteredSets].sort((a, b) => {
    if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
    if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredFolders = search.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : folders;

  const setCountByFolder = (folderId: string) =>
    sets.filter(s => s.folderId === folderId).length;

  const handleDeleteSet = (id: string) => {
    show({
      title: 'Delete Set',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(id);
          Toast.show({ type: 'success', text1: 'Set deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  const handleAssignFolder = (folderId: string | null) => {
    updateSet({ folderId }, {
      onSuccess: () => {
        folderModal.closeAssignModal();
        setSelectedSet(null);
        Toast.show({ type: 'success', text1: folderId ? 'Moved to folder' : 'Removed from folder' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  };

  const handleDeleteFolder = (id: string) => {
    show({
      title: 'Delete Folder',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFolderAsync(id);
          Toast.show({ type: 'success', text1: 'Folder deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  const handleCloseEditFolderModal = () => {
    folderModal.closeEditModal();
    setSelectedFolder(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Typography preset="h2">Library</Typography>
        <View style={styles.headerActions}>
          <Pressable onPress={toggleSearch} hitSlop={8}>
            <Icon name="search-outline" size={ICON_SIZE} color={searchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
          {activeTab === 'sets' && (
            <Pressable onPress={cycleSortOrder} hitSlop={8} style={styles.sortBtn}>
              <Icon name="swap-vertical-outline" size={ICON_SIZE} color={colors.primary} />
              <Typography preset="caption" color={colors.primary}>
                {sortOrder === 'newest' ? 'Recent' : sortOrder === 'alpha' ? 'A–Z' : 'Cards'}
              </Typography>
            </Pressable>
          )}
          <Pressable onPress={() => navigation.navigate('PublicSets')} hitSlop={8}>
            <Typography preset="label" color={colors.primary}>Browse Public</Typography>
          </Pressable>
        </View>
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabs}>
        {(['sets', 'folders'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Typography
              preset="label"
              color={activeTab === tab ? colors.primary : colors.textSecondary}
            >
              {tab === 'sets' ? 'SETS' : 'FOLDERS'}
            </Typography>
          </Pressable>
        ))}
      </View>

      {/* ── Search ── */}
      {searchVisible && (
        <View style={styles.searchWrap}>
          <Input
            placeholder={activeTab === 'sets' ? 'Search sets…' : 'Search folders…'}
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            autoFocus
          />
        </View>
      )}

      {/* ── Content ── */}
      {activeTab === 'sets' ? (
        <FlatList
          data={setsLoading ? [] : sortedSets}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={<Spacer size={spacing[8]} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { refetchFolders(); refetchSets(); }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <SetCard
              set={item}
              onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
              onMenuPress={() => setSelectedSet(item)}
            />
          )}
          ListEmptyComponent={
            setsLoading ? (
              <>
                <SetCardSkeleton />
                <SetCardSkeleton />
                <SetCardSkeleton />
              </>
            ) : (
              <EmptyState
                title={search ? 'No results' : 'No sets yet'}
                subtitle={search ? `No sets match "${search}"` : 'Create your first study set to get started'}
                ctaLabel={search ? undefined : 'Create Set'}
                onCta={search ? undefined : () => navigation.navigate('CreateSet', {})}
                style={styles.emptyState}
              />
            )
          }
        />
      ) : (
        <FlatList
          data={filteredFolders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={<Spacer size={spacing[8]} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { refetchFolders(); refetchSets(); }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <FolderCard
              folder={item}
              setCount={setCountByFolder(item.id)}
              onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name, folderColor: item.color })}
              onMenuPress={() => setSelectedFolder(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No results' : 'No folders yet'}
              subtitle={search ? `No folders match "${search}"` : 'Tap Create Folder to organise your sets'}
              style={styles.emptyState}
            />
          }
        />
      )}

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomCta}>
        <Button
          label={activeTab === 'sets' ? 'Create Set' : 'Create Folder'}
          onPress={() =>
            activeTab === 'sets'
              ? navigation.navigate('CreateSet', {})
              : folderModal.openCreateModal()
          }
          fullWidth
        />
      </View>

      {/* ── Set actions sheet ── */}
      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onStudy={() =>
          selectedSet &&
          navigation.navigate('Study', { setId: selectedSet.id, setTitle: selectedSet.title })
        }
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        onAssignFolder={() => folderModal.openAssignModal()}
        onEdit={() => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id })}
        onDelete={() => selectedSet && handleDeleteSet(selectedSet.id)}
      />

      {/* ── Folder actions sheet ── */}
      <ActionSheet
        visible={!!selectedFolder}
        title={selectedFolder?.name}
        onClose={() => setSelectedFolder(null)}
        actions={[
          {
            label: 'Create Set',
            iconName: 'add-circle-outline',
            onPress: () => selectedFolder && navigation.navigate('CreateSet', { folderId: selectedFolder.id }),
          },
          {
            label: 'Edit',
            iconName: 'pencil-outline',
            onPress: () => selectedFolder && folderModal.openEditModal(selectedFolder),
          },
          {
            label: 'Delete Folder',
            iconName: 'trash-outline',
            destructive: true,
            onPress: () => selectedFolder && handleDeleteFolder(selectedFolder.id),
          },
        ]}
      />

      {/* ── New folder modal ── */}
      <AppModal
        visible={folderModal.newFolderModalOpen}
        title="New Folder"
        onClose={folderModal.closeCreateModal}
      >
        <Input
          label="Folder name"
          placeholder="e.g. New Testament"
          value={folderModal.newFolderName}
          onChangeText={folderModal.setNewFolderName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={folderModal.handleCreateFolder}
        />
        <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
          Color
        </Typography>
        <ColorPicker value={folderModal.selectedColor} onChange={folderModal.setSelectedColor} />
        <Divider />
        <Button
          label="Create Folder"
          onPress={folderModal.handleCreateFolder}
          loading={folderModal.creatingFolder}
          fullWidth
        />
      </AppModal>

      {/* ── Edit folder modal ── */}
      <AppModal
        visible={folderModal.editFolderModalOpen}
        title="Edit Folder"
        onClose={handleCloseEditFolderModal}
      >
        <Input
          label="Folder name"
          value={folderModal.editFolderName}
          onChangeText={folderModal.setEditFolderName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={folderModal.handleEditFolder}
        />
        <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
          Color
        </Typography>
        <ColorPicker value={folderModal.editFolderColor} onChange={folderModal.setEditFolderColor} />
        <Divider />
        <Button
          label="Save Changes"
          onPress={folderModal.handleEditFolder}
          loading={folderModal.updatingFolder}
          fullWidth
        />
      </AppModal>

      {/* ── Assign Folder modal ── */}
      <AppModal
        visible={folderModal.assignFolderOpen}
        title="Move to Folder"
        onClose={folderModal.closeAssignModal}
      >
        <Pressable style={styles.setOption} onPress={() => handleAssignFolder(null)}>
          <Typography preset="body" color={colors.textSecondary}>No Folder</Typography>
        </Pressable>
        <Divider marginV={spacing[1]} />
        {folders.map(f => (
          <React.Fragment key={f.id}>
            <Pressable style={styles.setOption} onPress={() => handleAssignFolder(f.id)}>
              <Typography preset="body">{f.name}</Typography>
            </Pressable>
            <Divider marginV={spacing[1]} />
          </React.Fragment>
        ))}
      </AppModal>

      <ConfirmDialog {...dialogProps} />
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
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  tabActive: { borderBottomColor: colors.primary },
  searchWrap: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing[3],
  },
  searchInput: { marginBottom: 0 },
  scroll: { padding: layout.screenPaddingH },
  list: { gap: spacing[3] },
  separator: { height: spacing[3] },
  emptyState: { minHeight: 200 },
  colorLabel: { marginBottom: spacing[2] },
  bottomCta: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  setOption: { paddingVertical: spacing[3] },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
