import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { FolderCard, SetCard } from '../../components/domain';
import { ActionSheet, AppModal, EmptyState, SetCardSkeleton } from '../../components/feedback';
import { Button, Divider, Input, Spacer, Typography } from '../../components/ui';
import { useFolders, useSets, useDeleteSet, useCloneSet, useCreateFolder, useDeleteFolder } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } = useFolders();
  const { data: sets = [], isLoading: setsLoading, refetch: refetchSets } = useSets();
  const { mutate: deleteSet } = useDeleteSet();
  const { mutate: cloneSet } = useCloneSet();
  const { mutate: createFolder, isPending: creatingFolder } = useCreateFolder();
  const { mutate: deleteFolder } = useDeleteFolder();

  const refreshing = foldersLoading || setsLoading;

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sets;

  // Count sets per folder
  const setCountByFolder = (folderId: string) =>
    sets.filter(s => s.folderId === folderId).length;

  const handleDeleteSet = (id: string) => {
    Alert.alert('Delete Set', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteSet(id, {
            onSuccess: () => Toast.show({ type: 'success', text1: 'Set deleted' }),
            onError: err => Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) }),
          }),
      },
    ]);
  };

  const handleCloneSet = (id: string) => {
    cloneSet(id, {
      onSuccess: () => Toast.show({ type: 'success', text1: 'Set cloned' }),
      onError: err => Toast.show({ type: 'error', text1: 'Clone failed', text2: getErrorMessage(err) }),
    });
  };

  const handleDeleteFolder = (id: string) => {
    Alert.alert('Delete Folder', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteFolder(id, {
            onSuccess: () => Toast.show({ type: 'success', text1: 'Folder deleted' }),
            onError: err => Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) }),
          }),
      },
    ]);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder({ name: newFolderName.trim() }, {
      onSuccess: () => {
        setNewFolderName('');
        setNewFolderModalOpen(false);
        Toast.show({ type: 'success', text1: 'Folder created' });
      },
      onError: err => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Typography preset="h2">Library</Typography>
        <Pressable onPress={() => navigation.navigate('PublicSets')} hitSlop={8}>
          <Typography preset="label" color={colors.primary}>Browse Public</Typography>
        </Pressable>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <Input
          placeholder="Search sets…"
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { refetchFolders(); refetchSets(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Folders ── */}
        <View style={styles.sectionHeader}>
          <Typography preset="h4">Folders</Typography>
          <Pressable onPress={() => setNewFolderModalOpen(true)} hitSlop={8}>
            <Typography preset="label" color={colors.primary}>+ New</Typography>
          </Pressable>
        </View>

        {folders.length === 0 ? (
          <Typography preset="bodySm" color={colors.textSecondary} style={styles.emptyHint}>
            No folders yet — tap + New to create one
          </Typography>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}
            contentContainerStyle={styles.folderRowContent}>
            {folders.map(folder => (
              <FolderCard
                key={folder.id}
                folder={folder}
                setCount={setCountByFolder(folder.id)}
                onPress={() => navigation.navigate('FolderDetail', { folderId: folder.id, folderName: folder.name })}
                onLongPress={() => setSelectedFolder(folder)}
              />
            ))}
          </ScrollView>
        )}

        <Spacer size={spacing[6]} />

        {/* ── Sets ── */}
        <View style={styles.sectionHeader}>
          <Typography preset="h4">My Sets</Typography>
          <Pressable onPress={() => navigation.navigate('CreateSet', {})} hitSlop={8}>
            <Typography preset="label" color={colors.primary}>+ New</Typography>
          </Pressable>
        </View>

        {setsLoading ? (
          <>
            <SetCardSkeleton />
            <SetCardSkeleton />
            <SetCardSkeleton />
          </>
        ) : filteredSets.length === 0 ? (
          <EmptyState
            title={search ? 'No results' : 'No sets yet'}
            subtitle={search ? `No sets match "${search}"` : 'Create your first study set to get started'}
            ctaLabel={search ? undefined : 'Create Set'}
            onCta={search ? undefined : () => navigation.navigate('CreateSet', {})}
            style={styles.emptyState}
          />
        ) : (
          <View style={styles.setsList}>
            {filteredSets.map(set => (
              <SetCard
                key={set.id}
                set={set}
                onPress={() => navigation.navigate('SetDetail', { setId: set.id, setTitle: set.title })}
                onLongPress={() => setSelectedSet(set)}
              />
            ))}
          </View>
        )}

        <Spacer size={spacing[24]} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable style={styles.fab} onPress={() => setCreateMenuOpen(true)}>
        <Typography style={styles.fabIcon}>+</Typography>
      </Pressable>

      {/* ── Create menu ── */}
      <ActionSheet
        visible={createMenuOpen}
        title="Create"
        onClose={() => setCreateMenuOpen(false)}
        actions={[
          {
            label: '📚 New Study Set',
            onPress: () => navigation.navigate('CreateSet', {}),
          },
          {
            label: '📁 New Folder',
            onPress: () => setNewFolderModalOpen(true),
          },
        ]}
      />

      {/* ── Set actions sheet ── */}
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
            label: '➕ Add Cards',
            onPress: () => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id }),
          },
          {
            label: '📋 Clone',
            onPress: () => selectedSet && handleCloneSet(selectedSet.id),
          },
          {
            label: '🗑 Delete',
            destructive: true,
            onPress: () => selectedSet && handleDeleteSet(selectedSet.id),
          },
        ]}
      />

      {/* ── Folder actions sheet ── */}
      <ActionSheet
        visible={!!selectedFolder}
        title={selectedFolder?.name}
        onClose={() => setSelectedFolder(null)}
        actions={[
          {
            label: '🗑 Delete Folder',
            destructive: true,
            onPress: () => selectedFolder && handleDeleteFolder(selectedFolder.id),
          },
        ]}
      />

      {/* ── New folder modal ── */}
      <AppModal
        visible={newFolderModalOpen}
        title="New Folder"
        onClose={() => setNewFolderModalOpen(false)}
      >
        <Input
          label="Folder name"
          placeholder="e.g. New Testament"
          value={newFolderName}
          onChangeText={setNewFolderName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleCreateFolder}
        />
        <Divider />
        <Button
          label="Create Folder"
          onPress={handleCreateFolder}
          loading={creatingFolder}
          fullWidth
        />
      </AppModal>
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
  searchWrap: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[3],
  },
  searchInput: { marginBottom: 0 },
  scroll: { paddingHorizontal: layout.screenPaddingH },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  emptyHint: { marginBottom: spacing[3] },
  folderRow: { marginHorizontal: -layout.screenPaddingH },
  folderRowContent: { gap: spacing[3], paddingHorizontal: layout.screenPaddingH },
  setsList: { gap: spacing[3] },
  emptyState: { minHeight: 200 },
  fab: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { fontSize: 28, color: colors.textOnPrimary, lineHeight: 32 },
});
