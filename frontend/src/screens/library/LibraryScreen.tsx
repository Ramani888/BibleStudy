import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { FolderCard, SetActionSheet, SetCard } from '../../components/domain';
import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState, SelectSheet, SetCardSkeleton } from '../../components/feedback';
import { Button, ColorPicker, Input, Screen, Spacer, Typography } from '../../components/ui';
import { GlobeIcon, PencilIcon, PlusCircleIcon, SearchIcon, SortIcon, TrashIcon, UsersIcon } from '../../components/icons';

import {
  useConfirmDialog,
  useFolders,
  useSets,
  useDeleteSet,
  useUpdateSet,
  useDeleteFolder,
  useFolderModal,
  useSearchToggle,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

const ICON_SIZE = 20;

type Tab = 'sets' | 'folders';
type SortOrder = 'newest' | 'alpha' | 'cards';

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors, spacing } = theme;

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch, clear: clearSearch } = useSearchToggle();
  const [activeTab, setActiveTab] = useState<Tab>('sets');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [assignTargetSetId, setAssignTargetSetId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: folders = [], isLoading: foldersLoading, isRefetching: foldersRefetching, refetch: refetchFolders, isError: foldersError } = useFolders();
  const { data: sets = [], isLoading: setsLoading, isRefetching: setsRefetching, refetch: refetchSets, isError: setsError } = useSets();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet();
  const { show, dialogProps } = useConfirmDialog();
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();

  const folderModal = useFolderModal();

  const refreshing = foldersRefetching || setsRefetching;

  const cycleSortOrder = () =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'cards' : 'newest');

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.trim().toLowerCase()))
    : sets;

  const sortedSets = useMemo(() => [...filteredSets].sort((a, b) => {
    if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
    if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [filteredSets, sortOrder]);

  const filteredFolders = search.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : folders;

  const folderSetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sets) {
      if (s.folderId) counts[s.folderId] = (counts[s.folderId] ?? 0) + 1;
    }
    return counts;
  }, [sets]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    clearSearch();
  };

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
    if (!assignTargetSetId) return;
    updateSet({ id: assignTargetSetId, payload: { folderId } }, {
      onSuccess: () => {
        folderModal.closeAssignModal();
        setSelectedSet(null);
        setAssignTargetSetId(null);
        Toast.show({ type: 'success', text1: folderId ? 'Moved to folder' : 'Removed from folder' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  };

  const handleDeleteFolder = (id: string) => {
    show({
      title: 'Delete Folder',
      message: 'Sets inside will be moved to No Folder. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const result = await deleteFolderAsync(id);
          const n = result?.affectedSets ?? 0;
          Toast.show({
            type: 'success',
            text1: 'Folder deleted',
            text2: n > 0 ? `${n} set${n !== 1 ? 's' : ''} moved to No Folder` : undefined,
          });
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

  const currentFolderId = sets.find(s => s.id === assignTargetSetId)?.folderId;

  // ── Header (no title): actions row + full-width tabs + search ──
  const header = (
    <View>
      <View style={styles.headerActions}>
        {/* Left: other collections */}
        <View style={styles.headerGroup}>
          <Pressable onPress={() => navigation.navigate('FriendsSets')} hitSlop={8}>
            <UsersIcon size={ICON_SIZE} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('PublicSets')} hitSlop={8}>
            <GlobeIcon size={ICON_SIZE} color={colors.primary} />
          </Pressable>
        </View>

        {/* Right: current-list controls */}
        <View style={styles.headerGroup}>
          <Pressable onPress={toggleSearch} hitSlop={8}>
            <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
          {activeTab === 'sets' && (
            <Pressable onPress={cycleSortOrder} hitSlop={8} style={styles.sortBtn}>
              <SortIcon size={ICON_SIZE} color={colors.primary} />
              <Typography preset="caption" color={colors.primary}>
                {sortOrder === 'newest' ? 'Recent' : sortOrder === 'alpha' ? 'A–Z' : 'Cards'}
              </Typography>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.tabs}>
        {(['sets', 'folders'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => switchTab(tab)}
          >
            <Typography preset="label" color={activeTab === tab ? colors.primary : colors.textSecondary}>
              {tab === 'sets' ? 'SETS' : 'FOLDERS'}
            </Typography>
          </Pressable>
        ))}
      </View>

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
    </View>
  );

  // ── Footer (persistent create CTA) ──
  const footer = (
    <View style={styles.footer}>
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
  );

  return (
    <Screen header={header} footer={footer}>
      {/* ── Body ── */}
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
            ) : setsError ? (
              <ErrorState message="Failed to load sets" onRetry={refetchSets} />
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
              setCount={folderSetCounts[item.id] ?? 0}
              onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name, folderColor: item.color })}
              onMenuPress={() => setSelectedFolder(item)}
            />
          )}
          ListEmptyComponent={
            foldersLoading ? (
              <>
                <SetCardSkeleton />
                <SetCardSkeleton />
              </>
            ) : foldersError ? (
              <ErrorState message="Failed to load folders" onRetry={refetchFolders} />
            ) : (
              <EmptyState
                title={search ? 'No results' : 'No folders yet'}
                subtitle={search ? `No folders match "${search}"` : 'Tap Create Folder to organise your sets'}
                style={styles.emptyState}
              />
            )
          }
        />
      )}

      {/* ── Set actions sheet ── */}
      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onQuiz={() =>
          selectedSet &&
          navigation.navigate('QuizModePicker', { setId: selectedSet.id, setTitle: selectedSet.title })
        }
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        onAssignFolder={() => {
          if (selectedSet) setAssignTargetSetId(selectedSet.id);
          folderModal.openAssignModal();
        }}
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
            icon: PlusCircleIcon,
            onPress: () => selectedFolder && navigation.navigate('CreateSet', { folderId: selectedFolder.id }),
          },
          {
            label: 'Edit',
            icon: PencilIcon,
            onPress: () => selectedFolder && folderModal.openEditModal(selectedFolder),
          },
          {
            label: 'Delete Folder',
            icon: TrashIcon,
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
        footer={
          <Button
            label="Create Folder"
            onPress={folderModal.handleCreateFolder}
            loading={folderModal.creatingFolder}
            fullWidth
          />
        }
      >
        <View style={styles.modalBody}>
          <Input
            label="Folder name"
            placeholder="e.g. New Testament"
            value={folderModal.newFolderName}
            onChangeText={folderModal.setNewFolderName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={folderModal.handleCreateFolder}
            editable={!folderModal.creatingFolder}
            maxLength={200}
          />
          <View>
            <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
              Color
            </Typography>
            <ColorPicker value={folderModal.selectedColor} onChange={folderModal.setSelectedColor} />
          </View>
        </View>
      </AppModal>

      {/* ── Edit folder modal ── */}
      <AppModal
        visible={folderModal.editFolderModalOpen}
        title="Edit Folder"
        onClose={handleCloseEditFolderModal}
        footer={
          <Button
            label="Save Changes"
            onPress={folderModal.handleEditFolder}
            loading={folderModal.updatingFolder}
            fullWidth
          />
        }
      >
        <View style={styles.modalBody}>
          <Input
            label="Folder name"
            value={folderModal.editFolderName}
            onChangeText={folderModal.setEditFolderName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={folderModal.handleEditFolder}
            editable={!folderModal.updatingFolder}
            maxLength={200}
          />
          <View>
            <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
              Color
            </Typography>
            <ColorPicker value={folderModal.editFolderColor} onChange={folderModal.setEditFolderColor} />
          </View>
        </View>
      </AppModal>

      {/* ── Assign Folder picker ── */}
      <SelectSheet
        visible={folderModal.assignFolderOpen}
        title="Move to Folder"
        searchable={false}
        options={folders.filter(f => f.id !== currentFolderId).map(f => ({ id: f.id, label: f.name }))}
        leadingOption={{ label: 'No Folder', onPress: () => handleAssignFolder(null) }}
        onSelect={handleAssignFolder}
        onClose={() => { folderModal.closeAssignModal(); setAssignTargetSetId(null); }}
        emptyText="No folders yet"
      />

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPaddingH,
      paddingTop: spacing[3],
      paddingBottom: spacing[2],
    },
    headerGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
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
    separator: { height: spacing[3] },
    emptyState: { minHeight: 200 },
    modalBody: { gap: spacing[4] },
    colorLabel: { marginBottom: spacing[1.5] },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  });
