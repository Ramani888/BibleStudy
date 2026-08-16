import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { QuizModeSheet, SetActionSheet, SetCard } from '../../components/domain';
import { ConfirmDialog, EmptyState, ErrorState, SelectSheet } from '../../components/feedback';
import { Button, Screen, ScreenHeader, SearchBar, Spacer, Typography } from '../../components/ui';
import { SearchIcon } from '../../components/icons';

import { useConfirmDialog, useFolderModal, useFolders, useManualRefresh, useSearchToggle, useSets, useDeleteSet, useUpdateSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, layout } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const ICON_SIZE = 20;

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const { colors, spacing: sp } = useTheme();
  const { folderId, folderName, folderColor } = route.params;
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [quizSet, setQuizSet] = useState<{ id: string; title: string } | null>(null);
  const [assignTargetSetId, setAssignTargetSetId] = useState<string | null>(null);
  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();

  const { data: sets = [], isLoading, isError, refetch } = useSets(folderId);
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutate: updateSet } = useUpdateSet();
  const { data: allFolders = [] } = useFolders();
  const { show, dialogProps } = useConfirmDialog();
  const folderModal = useFolderModal();

  const filteredSets = useMemo(
    () => search.trim()
      ? sets.filter(s => s.title.toLowerCase().includes(search.trim().toLowerCase()))
      : sets,
    [sets, search],
  );

  const folderOptions = useMemo(
    () => allFolders.filter(f => f.id !== folderId).map(f => ({ id: f.id, label: f.name })),
    [allFolders, folderId],
  );

  const renderSetItem = useCallback(({ item }: { item: StudySet }) => (
    <SetCard
      set={item}
      onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
      onMenuPress={() => setSelectedSet(item)}
    />
  ), [navigation]);

  const handleGoBack       = useCallback(() => navigation.goBack(), [navigation]);
  const handleNavCreateSet = useCallback(() => navigation.navigate('CreateSet', { folderId }), [navigation, folderId]);
  const handleQuizStart    = useCallback((mode: any, ids: string[], titles: string[]) =>
    navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode }), [navigation]);
  const closeQuizSet       = useCallback(() => setQuizSet(null), []);
  const closeSelectedSet   = useCallback(() => { setSelectedSet(null); setAssignTargetSetId(null); }, []);

  const handleAssignFolder = useCallback((newFolderId: string | null) => {
    if (!assignTargetSetId) return;
    updateSet({ id: assignTargetSetId, payload: { folderId: newFolderId } }, {
      onSuccess: () => {
        folderModal.closeAssignModal();
        setAssignTargetSetId(null);
        Toast.show({ type: 'success', text1: newFolderId ? 'Moved to folder' : 'Removed from folder' });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) }),
    });
  }, [assignTargetSetId, updateSet, folderModal]);

  const handleDeleteSet = useCallback((set: StudySet) => {
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
  }, [show, deleteSetAsync]);

  const header = (
    <ScreenHeader
      title={folderName}
      onBack={handleGoBack}
      right={
        <Pressable onPress={toggleSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
          <SearchIcon size={ICON_SIZE} color={searchVisible ? colors.accent : colors.textSecondary} />
        </Pressable>
      }
    />
  );

  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label="Create Set" onPress={handleNavCreateSet} fullWidth />
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
      <View>
        {folderColor && <View style={[styles.colorBar, { backgroundColor: folderColor }]} />}
        {searchVisible && (
          <View style={styles.searchWrap}>
            <SearchBar
              placeholder="Search sets…"
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchInput}
              autoFocus
            />
          </View>
        )}
      </View>

      <View style={styles.flex}>
      <FlatList
        data={filteredSets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Typography preset="bodySm" color={colors.textSecondary} style={styles.count}>{filteredSets.length} {filteredSets.length === 1 ? 'set' : 'sets'}</Typography>}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ItemSeparatorComponent={() => <Spacer size={sp.md} />}
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No results' : 'No sets in this folder'}
            subtitle={search ? `No sets match "${search}"` : 'Create a set and assign it to this folder'}
          />
        }
        renderItem={renderSetItem}
      />

      </View>

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={closeSelectedSet}
        onQuiz={() => {
          if (!selectedSet) return;
          const target = { id: selectedSet.id, title: selectedSet.title };
          setSelectedSet(null);
          setTimeout(() => setQuizSet(target), 350);
        }}
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
        options={folderOptions}
        leadingOption={{ label: 'No Folder', onPress: () => handleAssignFolder(null) }}
        onSelect={handleAssignFolder}
        onClose={() => { folderModal.closeAssignModal(); setAssignTargetSetId(null); }}
        emptyText="No other folders"
      />

      <QuizModeSheet
        visible={!!quizSet}
        setIds={quizSet ? [quizSet.id] : []}
        setTitles={quizSet ? [quizSet.title] : []}
        onClose={closeQuizSet}
        onStart={handleQuizStart}
      />

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  iconPressed: { opacity: 0.85 },
  colorBar: { height: spacing.xs },
  searchWrap: { paddingHorizontal: layout.screenPaddingH, paddingTop: spacing.md },
  searchInput: { marginBottom: 0 },
  count: { marginBottom: spacing.md },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
});
