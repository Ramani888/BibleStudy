import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetActionSheet, SetCard } from '../../components/domain';
import { ConfirmDialog, EmptyState, ErrorState, SelectSheet, SetCardSkeleton } from '../../components/feedback';
import { Button, Input, Screen, ScreenHeader, Spacer, Typography } from '../../components/ui';
import { SearchIcon } from '../../components/icons';

import { useConfirmDialog, useFolderModal, useFolders, useManualRefresh, useSearchToggle, useSets, useDeleteSet, useUpdateSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors, spacing } = theme;
  const { folderId, folderName, folderColor } = route.params;
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [assignTargetSetId, setAssignTargetSetId] = useState<string | null>(null);
  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();

  const { data: sets = [], isLoading, isError, refetch } = useSets(folderId);
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet();
  const { data: allFolders = [] } = useFolders();
  const { show, dialogProps } = useConfirmDialog();
  const folderModal = useFolderModal();

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

  const header = (
    <ScreenHeader
      title={folderName}
      onBack={() => navigation.goBack()}
      right={
        <Pressable onPress={toggleSearch} hitSlop={8}>
          <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.primary : colors.textSecondary} />
        </Pressable>
      }
    />
  );

  const footer = (
    <View style={styles.footer}>
      <Button label="Create Set" onPress={() => navigation.navigate('CreateSet', { folderId })} fullWidth />
    </View>
  );

  if (isError) {
    return (
      <Screen header={header}>
        <ErrorState message="Could not load sets." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen header={header} footer={footer}>
      {folderColor && <View style={[styles.colorBar, { backgroundColor: folderColor }]} />}
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
        ListHeaderComponent={<Typography preset="bodySm" color={colors.textSecondary} style={styles.count}>{sets.length} {sets.length === 1 ? 'set' : 'sets'}</Typography>}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
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
        onDelete={() => selectedSet && handleDeleteSet(selectedSet)}
      />

      <SelectSheet
        visible={folderModal.assignFolderOpen}
        title="Move to Folder"
        searchable={false}
        options={allFolders.filter(f => f.id !== folderId).map(f => ({ id: f.id, label: f.name }))}
        leadingOption={{ label: 'No Folder', onPress: () => handleAssignFolder(null) }}
        onSelect={handleAssignFolder}
        onClose={() => { folderModal.closeAssignModal(); setAssignTargetSetId(null); }}
        emptyText="No other folders"
      />

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    colorBar: { height: 4 },
    searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing[3] },
    searchInput: { marginBottom: 0 },
    count: { marginBottom: spacing[3] },
    list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
