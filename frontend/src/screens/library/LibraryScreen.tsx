import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import type { FlatList } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { FolderFormSheet, MoveToFolderSheet, QuizModeSheet, SetActionSheet } from '../../components/domain';
import {
  QMAddButton, QMConfirmDialog, QMEmpty, QMFolderTile, QMSearchField, QMSegmented, QMSetRow,
  QMSheet, QMSortChip, QMStickyBar, qmRowEnter, type QMSheetAction,
} from '../../components/qm';
import { Typography } from '../../components/ui';
import {
  CardsIcon, FolderIcon, PencilIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon,
} from '../../components/icons';
import {
  useConfirmDialog,
  useFolders,
  useSets,
  useDeleteSet,
  useDeleteFolder,
  useFolderModal,
  useManualRefresh,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet, Folder } from '../../types';

type Tab = 'sets' | 'folders';
type SortOrder = 'newest' | 'alpha' | 'count';
type Row = StudySet | [Folder, Folder?];

const SORTS: SortOrder[] = ['newest', 'alpha', 'count'];

const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList;

export function LibraryScreen({ navigation }: LibraryScreenProps<'Library'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);
  const searchRef = useRef<TextInput>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('sets');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [quizSet, setQuizSet] = useState<{ id: string; title: string } | null>(null);
  const [assignTarget, setAssignTarget] = useState<StudySet | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders, isError: foldersError } = useFolders();
  const { data: sets = [], isLoading: setsLoading, refetch: refetchSets, isError: setsError } = useSets();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();
  const { show, dialogProps } = useConfirmDialog();
  const folderModal = useFolderModal();
  const { refreshing, onRefresh } = useManualRefresh(() => Promise.all([refetchFolders(), refetchSets()]));

  const isSets = activeTab === 'sets';
  const q = search.trim().toLowerCase();

  const folderSetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of sets) if (s.folderId) counts[s.folderId] = (counts[s.folderId] ?? 0) + 1;
    return counts;
  }, [sets]);
  const folderById = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders]);

  const sortedSets = useMemo(() => sets
    .filter(s => !q || s.title.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      if (sortOrder === 'count') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }), [sets, q, sortOrder]);

  const sortedFolders = useMemo(() => folders
    .filter(f => !q || f.name.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sortOrder === 'alpha') return a.name.localeCompare(b.name);
      if (sortOrder === 'count') return (folderSetCounts[b.id] ?? 0) - (folderSetCounts[a.id] ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }), [folders, q, sortOrder, folderSetCounts]);

  // Folders render 2 per row.
  const folderRows = useMemo(() => {
    const rows: [Folder, Folder?][] = [];
    for (let i = 0; i < sortedFolders.length; i += 2) rows.push([sortedFolders[i], sortedFolders[i + 1]]);
    return rows;
  }, [sortedFolders]);

  const loading = isSets ? setsLoading : foldersLoading;
  const failed = isSets ? setsError : foldersError;
  const hasAny = isSets ? sets.length > 0 : folders.length > 0;
  const shown = isSets ? sortedSets.length : sortedFolders.length;

  const switchTab = useCallback((tab: Tab) => { setActiveTab(tab); setSearch(''); }, []);
  // Leaving the Library tab clears the search; opening a set and coming back keeps it.
  useEffect(() => navigation.getParent()?.addListener('blur', () => setSearch('')), [navigation]);
  const cycleSort = useCallback(() => setSortOrder(s => SORTS[(SORTS.indexOf(s) + 1) % SORTS.length]), []);
  const sortLabel = sortOrder === 'newest' ? t('common:sort.recent', 'Recent')
    : sortOrder === 'alpha' ? t('library:qm.sortAZ', 'A to Z')
    : isSets ? t('library:qm.sortMostCards', 'Most cards') : t('library:qm.sortMostSets', 'Most sets');

  const goToSearch = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setTimeout(() => searchRef.current?.focus(), 250);
  }, []);

  const handleDeleteSet = useCallback((set: StudySet) => {
    const count = set._count?.cards ?? 0;
    show({
      title: t('library:qm.deleteSetTitle', 'Delete this set?'),
      message: t('library:qm.deleteSetMessage', { title: set.title, count, defaultValue: `“${set.title}” and its ${count} cards will be gone for good.` }),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(set.id);
          Toast.show({ type: 'success', text1: t('library:sets.setDeleted', 'Set deleted') });
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteSetAsync, t]);

  const handleDeleteFolder = useCallback((id: string) => {
    show({
      title: t('library:qm.deleteFolderTitle', 'Delete this folder?'),
      message: t('library:qm.deleteFolderMessage', 'The sets inside stay in your library. Only the folder goes.'),
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


  const folderActions = useMemo<QMSheetAction[]>(() => {
    const f = selectedFolder;
    if (!f) return [];
    return [
      { label: t('library:qm.newSetInFolder', 'New set in this folder'), icon: PlusIcon, onPress: () => navigation.navigate('CreateSet', { folderId: f.id }) },
      { label: t('library:qm.editFolder', 'Edit folder'), icon: PencilIcon, onPress: () => folderModal.openEditModal(f) },
      { label: t('library:qm.deleteFolder', 'Delete folder'), icon: TrashIcon, danger: true, onPress: () => handleDeleteFolder(f.id) },
    ];
  }, [selectedFolder, navigation, folderModal, handleDeleteFolder, t]);

  const renderItem = useCallback(({ item, index }: { item: Row; index: number }) => {
    if (Array.isArray(item)) {
      return (
        <Animated.View entering={qmRowEnter(index * 2)} style={styles.folderRow}>
          {item.map((f, i) => f ? (
            <QMFolderTile
              key={f.id}
              name={f.name}
              color={f.color}
              meta={t('library:folders.setsCount', { count: folderSetCounts[f.id] ?? 0 })}
              onPress={() => navigation.navigate('FolderDetail', { folderId: f.id, folderName: f.name, folderColor: f.color })}
              onMenu={() => setSelectedFolder(f)}
              menuLabel={t('library:qm.optionsFor', { name: f.name, defaultValue: `Options for ${f.name}` })}
            />
          ) : <View key={i} style={styles.flex} />)}
        </Animated.View>
      );
    }
    const count = item._count?.cards ?? 0;
    return (
      <Animated.View entering={qmRowEnter(index)}>
        <QMSetRow
          title={item.title}
          color={item.color}
          meta={`${t('library:cards.cardCount', { count })} · ${formatDate(item.updatedAt)}`}
          chip={item.visibility === 'PUBLIC' ? t('library:sets.visibilityPublic', 'Public') : item.visibility === 'FRIENDS' ? t('library:sets.visibilityFriends', 'Friends') : undefined}
          onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
          onMenu={() => setSelectedSet(item)}
          menuLabel={t('library:qm.optionsFor', { name: item.title, defaultValue: `Options for ${item.title}` })}
        />
      </Animated.View>
    );
  }, [navigation, folderSetCounts, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.s18 }}>
      <View style={styles.titleRow}>
        <Typography preset="qmDisplay" color={qm.ink}>{t('library:qm.title', 'My library')}</Typography>
        <QMAddButton
          onPress={isSets ? () => navigation.navigate('CreateSet', {}) : folderModal.openCreateModal}
          label={isSets ? t('library:qm.newSetA11y', 'Create a new set') : t('library:qm.newFolderA11y', 'Create a folder')}
        />
      </View>
      {hasAny && (
        <View style={styles.searchWrap}>
          <QMSearchField
            ref={searchRef}
            value={search}
            onChangeText={setSearch}
            placeholder={isSets ? t('library:qm.searchSets', 'Search your sets') : t('library:qm.searchFolders', 'Search your folders')}
          />
        </View>
      )}
      <View style={styles.segWrap}>
        <QMSegmented
          label={t('library:qm.viewA11y', 'Library view')}
          value={activeTab}
          onChange={switchTab}
          options={[
            { key: 'sets', label: t('library:qm.mySets', 'My sets') },
            { key: 'folders', label: t('library:tabs.folders', 'Folders') },
          ]}
        />
      </View>
      {shown > 0 && (
        <View style={styles.countRow}>
          <Typography preset="qmBody" color={qm.muted}>
            {isSets ? t('library:qm.setCount', { count: shown }) : t('library:qm.folderCount', { count: shown })}
          </Typography>
          <QMSortChip label={sortLabel} onPress={cycleSort} />
        </View>
      )}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (loading) {
    empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  } else if (failed) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={RefreshIcon}
        title={t('library:qm.loadFailedTitle', 'Your library did not load')}
        text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
        action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: onRefresh }}
      />
    );
  } else if (!hasAny && isSets) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={CardsIcon}
        title={t('library:qm.emptySetsTitle', 'Create your first set')}
        text={t('library:qm.emptySetsText', 'A set holds your cards. Make one for a book, a theme or last Sunday’s sermon.')}
        action={{ label: t('library:qm.createSet', 'Create a set'), onPress: () => navigation.navigate('CreateSet', {}) }}
      />
    );
  } else if (!hasAny) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={FolderIcon}
        title={t('library:folders.noFolders', 'No folders yet')}
        text={t('library:qm.emptyFoldersText', 'Folders keep your sets tidy. Make one for a book of the Bible or your small group.')}
        action={{ label: t('library:qm.newFolder', 'New folder'), onPress: folderModal.openCreateModal }}
      />
    );
  } else if (!shown) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={SearchIcon}
        title={isSets ? t('library:qm.noSetsMatch', 'No sets match') : t('library:qm.noFoldersMatch', 'No folders match')}
        text={t('library:qm.noMatchText', { query: search.trim(), defaultValue: `Nothing called “${search.trim()}”. Try a different word.` })}
        action={{ label: t('library:qm.clearSearch', 'Clear search'), onPress: () => setSearch('') }}
      />
    );
  }

  const footer = (
    <Typography preset="qmBody" color={qm.muted} align="center" style={shown ? styles.exploreGap : styles.exploreGapEmpty}>
      {t('library:qm.lookingForMore', 'Looking for more?')}{' '}
      <Typography preset="qmLink" color={qm.link} onPress={() => navigation.navigate('PublicSets')} accessibilityRole="link">
        {t('library:qm.explorePublic', 'Explore public sets')}
      </Typography>
    </Typography>
  );


  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <AnimatedFlatList
        ref={listRef}
        data={loading || failed ? [] : (isSets ? sortedSets : folderRows) as Row[]}
        keyExtractor={(item: Row) => Array.isArray(item) ? item[0].id : item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={loading || failed ? null : footer}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />

      <QMStickyBar
        title={t('library:qm.title', 'My library')}
        scrollY={scrollY}
        right={(
          <Pressable onPress={goToSearch} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('library:qm.searchA11y', 'Search')}>
            <SearchIcon size={20} color={qm.ink} />
          </Pressable>
        )}
      />

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onQuiz={() => selectedSet && setQuizSet({ id: selectedSet.id, title: selectedSet.title })}
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        folderName={selectedSet?.folderId ? folderById.get(selectedSet.folderId)?.name : null}
        onAssignFolder={() => setAssignTarget(selectedSet)}
        onEdit={() => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id })}
        onDelete={() => selectedSet && handleDeleteSet(selectedSet)}
      />

      <QuizModeSheet
        visible={!!quizSet}
        setIds={quizSet ? [quizSet.id] : []}
        setTitles={quizSet ? [quizSet.title] : []}
        onClose={() => setQuizSet(null)}
        onStart={(mode, ids, titles) => navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode })}
      />

      <MoveToFolderSheet set={assignTarget} onClose={() => setAssignTarget(null)} />

      <QMSheet
        visible={!!selectedFolder && !folderModal.editFolderModalOpen}
        onClose={() => setSelectedFolder(null)}
        title={selectedFolder?.name}
        sub={selectedFolder ? t('library:folders.setsCount', { count: folderSetCounts[selectedFolder.id] ?? 0 }) : undefined}
        actions={folderActions}
      />

      <FolderFormSheet modal={folderModal} onClosed={() => setSelectedFolder(null)} />

      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchWrap: { marginTop: spacing.lg },
  segWrap: { marginTop: spacing.s14 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.md },
  sep: { height: spacing.s10 },
  folderRow: { flexDirection: 'row', gap: spacing.md },
  loading: { marginTop: spacing.s48 },
  emptyGap: { marginTop: spacing.s48 + spacing.sm },
  exploreGap: { marginTop: spacing.s22 },
  exploreGapEmpty: { marginTop: spacing.huge },
});
