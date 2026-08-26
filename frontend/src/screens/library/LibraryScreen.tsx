import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { FolderCard, QuizModeSheet, SetActionSheet, SetCard } from '../../components/domain';
import { ActionSheet, AppModal, ConfirmDialog, EmptyState, ErrorState, SelectSheet } from '../../components/feedback';
import { Button, ColorPicker, Input, Screen, SearchBar, Spacer, Typography } from '../../components/ui';
import { BookIcon, FolderIcon, GlobeIcon, PencilIcon, PlusCircleIcon, SearchIcon, SortIcon, TrashIcon, UsersIcon } from '../../components/icons';

import {
  useConfirmDialog,
  useFolders,
  useSets,
  useDeleteSet,
  useUpdateSet,
  useDeleteFolder,
  useFolderModal,
  useSearchToggle,
  useManualRefresh,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTranslation } from 'react-i18next';
import { layout, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

const ICON_SIZE = 20;

type Tab = 'sets' | 'folders';
type SortOrder = 'newest' | 'alpha' | 'cards';

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const { t } = useTranslation(['library', 'common']);
  const { colors } = useTheme();

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch, clear: clearSearch } = useSearchToggle();
  const [activeTab, setActiveTab] = useState<Tab>('sets');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [quizSet, setQuizSet] = useState<{ id: string; title: string }[] | null>(null);
  const [assignTargetSetId, setAssignTargetSetId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders, isError: foldersError } = useFolders();
  const { data: sets = [], isLoading: setsLoading, refetch: refetchSets, isError: setsError } = useSets();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet();
  const { show, dialogProps } = useConfirmDialog();
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();

  const folderModal = useFolderModal();

  const { refreshing, onRefresh } = useManualRefresh(() => Promise.all([refetchFolders(), refetchSets()]));

  const cycleSortOrder = useCallback(() =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'cards' : 'newest'), []);

  const switchTab = useCallback((tab: Tab) => { setActiveTab(tab); clearSearch(); }, [clearSearch]);
  const closeSelectedSet    = useCallback(() => setSelectedSet(null), []);
  const closeSelectedFolder = useCallback(() => setSelectedFolder(null), []);
  const closeQuizSet        = useCallback(() => setQuizSet(null), []);
  const handleCreateItem    = useCallback(() =>
    activeTab === 'sets' ? navigation.navigate('CreateSet', {}) : folderModal.openCreateModal(),
    [activeTab, navigation, folderModal]);
  const handleQuizStart     = useCallback((mode: any, ids: string[], titles: string[]) =>
    navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode }), [navigation]);

  const filteredSets = useMemo(
    () => search.trim()
      ? sets.filter(s => s.title.toLowerCase().includes(search.trim().toLowerCase()))
      : sets,
    [sets, search],
  );

  const sortedSets = useMemo(() => [...filteredSets].sort((a, b) => {
    if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
    if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [filteredSets, sortOrder]);

  const filteredFolders = useMemo(
    () => search.trim()
      ? folders.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
      : folders,
    [folders, search],
  );

  const folderSetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sets) {
      if (s.folderId) counts[s.folderId] = (counts[s.folderId] ?? 0) + 1;
    }
    return counts;
  }, [sets]);

  const sortedFolders = useMemo(() => [...filteredFolders].sort((a, b) => {
    if (sortOrder === 'alpha') return a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }), [filteredFolders, sortOrder]);

  const handleDeleteSet = useCallback((id: string) => {
    show({
      title: t('common:dialogs.deleteConfirmTitle'),
      message: t('library:dialogs.deleteSetMessage', 'Are you sure you want to delete this study set? This will permanently delete all its cards.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(id);
          Toast.show({ type: 'success', text1: t('library:sets.setDeleted', 'Set deleted') });
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteSetAsync, t]);

  const handleAssignFolder = useCallback((folderId: string | null) => {
    if (!assignTargetSetId) return;
    updateSet(
      { id: assignTargetSetId, payload: { folderId } },
      {
        onSuccess: () => {
          folderModal.closeAssignModal();
          Toast.show({ type: 'success', text1: folderId ? t('library:folders.movedToFolder', 'Moved to folder') : t('library:folders.removedFromFolder', 'Removed from folder') });
        },
        onError: (err: any) => {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        },
      },
    );
  }, [assignTargetSetId, updateSet, folderModal, t]);

  const handleDeleteFolder = useCallback((id: string) => {
    show({
      title: t('common:dialogs.deleteConfirmTitle'),
      message: t('library:dialogs.deleteFolderMessage', 'Are you sure you want to delete this folder? Sets inside will not be deleted.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFolderAsync(id);
          Toast.show({ type: 'success', text1: t('library:folders.folderDeleted', 'Folder deleted') });
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteFolderAsync, t]);

  const handleCloseEditFolderModal = useCallback(() => {
    folderModal.closeEditModal();
    setSelectedFolder(null);
  }, [folderModal]);

  const currentFolderId = sets.find(s => s.id === assignTargetSetId)?.folderId;

  const renderSetItem = useCallback(
    ({ item }: { item: StudySet }) => (
      <SetCard
        set={item}
        onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
        onLongPress={() => setSelectedSet(item)}
      />
    ),
    [navigation],
  );

  const renderFolderItem = useCallback(
    ({ item }: { item: Folder }) => (
      <FolderCard
        folder={item}
        setCount={folderSetCounts[item.id] ?? 0}
        onPress={() => navigation.navigate('FolderDetail', { folderId: item.id, folderName: item.name })}
        onLongPress={() => setSelectedFolder(item)}
      />
    ),
    [navigation, folderSetCounts],
  );

  // ── Header (title + search + sort + tab strip) ──
  const header = (
    <View>
      <View style={styles.headerActions}>
        <Typography preset="h3" color={colors.textPrimary}>{t('library:tabs.mySets')}</Typography>
        <View style={styles.headerGroup}>
          <Pressable onPress={toggleSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
            <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.accent : colors.textSecondary} />
          </Pressable>
          <Pressable onPress={cycleSortOrder} hitSlop={8} style={({ pressed }) => [styles.sortBtn, pressed && styles.iconPressed]}>
            <SortIcon size={ICON_SIZE} color={colors.accent} />
            <Typography preset="caption" color={colors.accent}>
              {sortOrder === 'newest' ? t('common:sort.recent', 'Recent') : sortOrder === 'alpha' ? t('common:sort.alpha', 'A–Z') : activeTab === 'sets' ? t('common:sort.cards', 'Cards') : t('common:sort.sets', 'Sets')}
            </Typography>
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['sets', 'folders'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={({ pressed }) => [styles.tab, { borderBottomColor: activeTab === tab ? colors.accent : colors.transparent }, pressed && styles.iconPressed]}
            onPress={() => switchTab(tab)}
          >
            <Typography preset="label" color={activeTab === tab ? colors.accent : colors.textSecondary}>
              {tab === 'sets' ? t('library:tabs.mySets').toUpperCase() : t('library:tabs.folders').toUpperCase()}
            </Typography>
          </Pressable>
        ))}
      </View>

      {searchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder={activeTab === 'sets' ? t('library:sets.searchPlaceholder', 'Search sets…') : t('library:folders.searchPlaceholder', 'Search folders…')}
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
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button
        label={activeTab === 'sets' ? t('library:sets.createSet') : t('library:folders.createFolder')}
        onPress={handleCreateItem}
        fullWidth
      />
    </View>
  );

  return (
    <Screen header={header} footer={footer}>
      {/* ── Body ── */}
      {activeTab === 'sets' ? (
        <View style={styles.flex}>
        <FlatList
          data={setsLoading ? [] : sortedSets}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={<Spacer size={spacing.xxxl} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={renderSetItem}
          ListEmptyComponent={
            setsError ? (
              <ErrorState message={t('common:status.failedToLoad', 'Failed to load sets')} onRetry={refetchSets} />
            ) : (
              <EmptyState
                title={search ? t('common:status.noResults', 'No results') : t('library:sets.noSets', 'No sets yet')}
                subtitle={search ? t('common:status.noMatchFor', { query: search, defaultValue: `No sets match "${search}"` }) : t('library:sets.emptyDesc', 'Create your first study set to get started')}
                style={styles.emptyState}
              />
            )
          }
        />
        </View>
      ) : (
        <View style={styles.flex}>
        <FlatList
          data={foldersLoading ? [] : sortedFolders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={<Spacer size={spacing.xxxl} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={renderFolderItem}
          ListEmptyComponent={
            foldersError ? (
              <ErrorState message={t('common:status.failedToLoad', 'Failed to load folders')} onRetry={refetchFolders} />
            ) : (
              <EmptyState
                title={search ? t('common:status.noResults', 'No results') : t('library:folders.noFolders', 'No folders yet')}
                subtitle={search ? t('common:status.noMatchFor', { query: search, defaultValue: `No folders match "${search}"` }) : t('library:folders.emptyDesc', 'Tap Create Folder to organise your sets')}
                style={styles.emptyState}
              />
            )
          }
        />
        </View>
      )}

      {/* ── Set actions sheet ── */}
      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={closeSelectedSet}
        onQuiz={() => {
          if (!selectedSet) return;
          const target = { id: selectedSet.id, title: selectedSet.title };
          setSelectedSet(null);
          setTimeout(() => setQuizSet([target]), 350);
        }}
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        onAssignFolder={() => {
          if (selectedSet) setAssignTargetSetId(selectedSet.id);
          folderModal.openAssignModal();
        }}
        onEdit={() => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id })}
        onDelete={() => selectedSet && handleDeleteSet(selectedSet.id)}
      />

      <QuizModeSheet
        visible={!!quizSet}
        setIds={quizSet ? [quizSet[0].id] : []}
        setTitles={quizSet ? [quizSet[0].title] : []}
        onClose={closeQuizSet}
        onStart={handleQuizStart}
      />

      {/* ── Folder actions sheet ── */}
      <ActionSheet
        visible={!!selectedFolder}
        title={selectedFolder?.name}
        onClose={closeSelectedFolder}
        actions={[
          {
            label: t('library:sets.createSet', 'Create Set'),
            icon: PlusCircleIcon,
            onPress: () => selectedFolder && navigation.navigate('CreateSet', { folderId: selectedFolder.id }),
          },
          {
            label: t('common:actions.edit', 'Edit'),
            icon: PencilIcon,
            onPress: () => selectedFolder && folderModal.openEditModal(selectedFolder),
          },
          {
            label: t('library:folders.deleteFolderTitle', 'Delete Folder'),
            icon: TrashIcon,
            destructive: true,
            onPress: () => selectedFolder && handleDeleteFolder(selectedFolder.id),
          },
        ]}
      />

      {/* ── New folder modal ── */}
      <AppModal
        visible={folderModal.newFolderModalOpen}
        title={t('library:folders.newFolder', 'New Folder')}
        onClose={folderModal.closeCreateModal}
        footer={
          <Button
            label={t('library:folders.createFolder', 'Create Folder')}
            onPress={folderModal.handleCreateFolder}
            loading={folderModal.creatingFolder}
            fullWidth
          />
        }
      >
        <View style={styles.modalBody}>
          <Input
            label={t('library:folders.folderName', 'Folder name')}
            placeholder={t('library:folders.folderNamePlaceholder', 'e.g. New Testament')}
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
              {t('library:folders.color', 'Color')}
            </Typography>
            <ColorPicker value={folderModal.selectedColor} onChange={folderModal.setSelectedColor} />
          </View>
        </View>
      </AppModal>

      {/* ── Edit folder modal ── */}
      <AppModal
        visible={folderModal.editFolderModalOpen}
        title={t('library:folders.editFolder', 'Edit Folder')}
        onClose={handleCloseEditFolderModal}
        footer={
          <Button
            label={t('common:actions.saveChanges', 'Save Changes')}
            onPress={folderModal.handleEditFolder}
            loading={folderModal.updatingFolder}
            fullWidth
          />
        }
      >
        <View style={styles.modalBody}>
          <Input
            label={t('library:folders.folderName', 'Folder name')}
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
              {t('library:folders.color', 'Color')}
            </Typography>
            <ColorPicker value={folderModal.editFolderColor} onChange={folderModal.setEditFolderColor} />
          </View>
        </View>
      </AppModal>

      {/* ── Assign Folder picker ── */}
      <SelectSheet
        visible={folderModal.assignFolderOpen}
        title={t('library:folders.moveToFolder', 'Move to Folder')}
        searchPlaceholder={t('library:folders.searchPlaceholder', 'Search folders…')}
        options={folders.map(f => ({ id: f.id, label: f.name, color: f.color }))}
        optionIcon={FolderIcon}
        selectedId={currentFolderId ?? undefined}
        onSelect={handleAssignFolder}
        onClose={() => { folderModal.closeAssignModal(); setAssignTargetSetId(null); }}
        emptyText={t('library:folders.noFolders', 'No folders yet')}
      />

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  searchWrap: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.md,
  },
  searchInput: { marginBottom: 0 },
  scroll: { padding: layout.screenPaddingH },
  separator: { height: spacing.md },
  emptyState: { minHeight: 200 }, // ponytail: off-grid Figma value
  flex: { flex: 1 },
  iconPressed: { opacity: 0.85 },
  modalBody: { gap: spacing.lg },
  colorLabel: { marginBottom: spacing.s6 },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
