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
import { Button, ColorPicker, Divider, Input, Spacer, Typography } from '../../components/ui';
import {
  useFolders,
  useSets,
  useDeleteSet,
  useUpdateSet,
  useCreateFolder,
  useDeleteFolder,
  useUpdateFolder,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

type Tab = 'sets' | 'folders';

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('sets');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState<string | null>(null);
  const [assignFolderOpen, setAssignFolderOpen] = useState(false);

  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } = useFolders();
  const { data: sets = [], isLoading: setsLoading, refetch: refetchSets } = useSets();
  const { mutate: deleteSet } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet(selectedSet?.id ?? '');
  const { mutate: createFolder, isPending: creatingFolder } = useCreateFolder();
  const { mutate: deleteFolder } = useDeleteFolder();
  const { mutate: updateFolder, isPending: updatingFolder } = useUpdateFolder(selectedFolder?.id ?? '');

  const refreshing = foldersLoading || setsLoading;

  const filteredSets = search.trim()
    ? sets.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sets;

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

  const handleAssignFolder = (folderId: string | null) => {
    updateSet({ folderId }, {
      onSuccess: () => {
        setAssignFolderOpen(false);
        setSelectedSet(null);
        Toast.show({ type: 'success', text1: folderId ? 'Moved to folder' : 'Removed from folder' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
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

  const handleCloseEditFolderModal = () => {
    setEditFolderModalOpen(false);
    setEditFolderName('');
    setEditFolderColor(null);
    setSelectedFolder(null);
  };

  const handleEditFolder = () => {
    if (!editFolderName.trim() || !selectedFolder) return;
    updateFolder({ name: editFolderName.trim(), color: editFolderColor }, {
      onSuccess: () => {
        handleCloseEditFolderModal();
        Toast.show({ type: 'success', text1: 'Folder updated' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Update failed', text2: getErrorMessage(err) }),
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder({ name: newFolderName.trim(), color: selectedColor ?? undefined }, {
      onSuccess: () => {
        setNewFolderName('');
        setSelectedColor(null);
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

      {/* ── Search (SETS tab only) ── */}
      {activeTab === 'sets' && (
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search sets…"
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
          />
        </View>
      )}

      {/* ── Content ── */}
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
        {activeTab === 'sets' ? (
          setsLoading ? (
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
            <View style={styles.list}>
              {filteredSets.map(set => (
                <SetCard
                  key={set.id}
                  set={set}
                  onPress={() => navigation.navigate('SetDetail', { setId: set.id, setTitle: set.title })}
                  onMenuPress={() => setSelectedSet(set)}
                />
              ))}
            </View>
          )
        ) : (
          folders.length === 0 ? (
            <EmptyState
              title="No folders yet"
              subtitle="Tap Create Folder to organise your sets"
              style={styles.emptyState}
            />
          ) : (
            <View style={styles.list}>
              {folders.map(folder => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  setCount={setCountByFolder(folder.id)}
                  onPress={() => navigation.navigate('FolderDetail', { folderId: folder.id, folderName: folder.name })}
                  onMenuPress={() => setSelectedFolder(folder)}
                />
              ))}
            </View>
          )
        )}
        <Spacer size={spacing[8]} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomCta}>
        <Button
          label={activeTab === 'sets' ? 'Create Set' : 'Create Folder'}
          onPress={() =>
            activeTab === 'sets'
              ? navigation.navigate('CreateSet', {})
              : setNewFolderModalOpen(true)
          }
          fullWidth
        />
      </View>

      {/* ── Set actions sheet ── */}
      <ActionSheet
        visible={!!selectedSet}
        title={selectedSet?.title}
        onClose={() => setSelectedSet(null)}
        actions={[
          {
            label: '➕ Create Card',
            onPress: () => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id }),
          },
          {
            label: '📁 Assign Folder',
            onPress: () => setAssignFolderOpen(true),
          },
          {
            label: '✏️ Edit',
            onPress: () => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id }),
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
            label: '➕ Create Set',
            onPress: () => selectedFolder && navigation.navigate('CreateSet', { folderId: selectedFolder.id }),
          },
          {
            label: '✏️ Edit',
            onPress: () => {
              if (!selectedFolder) return;
              setEditFolderName(selectedFolder.name);
              setEditFolderColor(selectedFolder.color);
              setEditFolderModalOpen(true);
            },
          },
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
        onClose={() => { setNewFolderModalOpen(false); setNewFolderName(''); setSelectedColor(null); }}
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
        <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
          Color
        </Typography>
        <ColorPicker value={selectedColor} onChange={setSelectedColor} />
        <Divider />
        <Button
          label="Create Folder"
          onPress={handleCreateFolder}
          loading={creatingFolder}
          fullWidth
        />
      </AppModal>

      {/* ── Edit folder modal ── */}
      <AppModal
        visible={editFolderModalOpen}
        title="Edit Folder"
        onClose={handleCloseEditFolderModal}
      >
        <Input
          label="Folder name"
          value={editFolderName}
          onChangeText={setEditFolderName}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleEditFolder}
        />
        <Typography preset="label" color={colors.textSecondary} style={styles.colorLabel}>
          Color
        </Typography>
        <ColorPicker value={editFolderColor} onChange={setEditFolderColor} />
        <Divider />
        <Button
          label="Save Changes"
          onPress={handleEditFolder}
          loading={updatingFolder}
          fullWidth
        />
      </AppModal>

      {/* ── Assign Folder modal ── */}
      <AppModal
        visible={assignFolderOpen}
        title="Move to Folder"
        onClose={() => setAssignFolderOpen(false)}
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
});
