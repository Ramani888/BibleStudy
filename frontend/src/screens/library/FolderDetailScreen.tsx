import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { FolderFormSheet, MoveToFolderSheet, QuizModeSheet, SetActionSheet } from '../../components/domain';
import {
  QMConfirmDialog, QMEmpty, QMSearchField, QMSetRow, QMSheet, qmRowEnter, type QMSheetAction,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  ChevronLeftIcon, FolderIcon, MoreVerticalIcon, PencilIcon, PlusIcon, RefreshIcon, SearchIcon, TrashIcon,
} from '../../components/icons';
import {
  useConfirmDialog, useDeleteFolder, useDeleteSet, useFolderModal, useFolders, useManualRefresh, useSets,
} from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, radius, mixHex, qmAccent } from '../../theme';
import { formatDate } from '../../utils/formatters';
import type { LibraryScreenProps } from '../../navigation/types';
import type { StudySet } from '../../types';

const TOUCH = 44;
const HERO_TOP = 68;     // canvas hero padding below the status bar
const HERO_ICON_W = 70;
const HERO_ICON_H = 60;
const CTA_H = 52;
const FROST = { light: 'rgba(255,255,255,0.6)', dark: 'rgba(0,0,0,0.2)' } as const; // canvas --frost

export function FolderDetailScreen({ navigation, route }: LibraryScreenProps<'FolderDetail'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const dark = themeName === 'dark';
  const insets = useSafeAreaInsets();
  const { folderId } = route.params;

  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<StudySet | null>(null);
  const [quizSet, setQuizSet] = useState<{ id: string; title: string } | null>(null);
  const [assignTarget, setAssignTarget] = useState<StudySet | null>(null);
  const [folderMenu, setFolderMenu] = useState(false);

  const { data: sets = [], isLoading, isError, isPending, fetchStatus, refetch } = useSets(folderId);
  // Offline with nothing saved: the query is paused, not loading — show the error, not "empty".
  const failed = isError || (isPending && fetchStatus === 'paused');
  const { data: folders = [] } = useFolders();
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();
  const { show, dialogProps } = useConfirmDialog();
  const folderModal = useFolderModal();

  // Live folder (picks up renames/recolours); route params until it loads.
  const folder = folders.find(f => f.id === folderId);
  const folderName = folder?.name ?? route.params.folderName;
  const folderColor = folder ? folder.color : route.params.folderColor;
  const heroBg = folderColor ? mixHex(folderColor, qm.bg, 0.14) : qm.field;
  const heroInk = folderColor ? qmAccent(qm, dark, folderColor)[1] : qm.muted;
  const frost = dark ? FROST.dark : FROST.light;

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => sets.filter(s => !q || s.title.toLowerCase().includes(q)), [sets, q]);
  const cardsTotal = useMemo(() => sets.reduce((a, s) => a + (s._count?.cards ?? 0), 0), [sets]);
  const folderMeta = failed ? '' : sets.length
    ? `${t('library:folders.setsCount', { count: sets.length })}, ${t('library:cards.cardCount', { count: cardsTotal })}`
    : t('library:qm.noSetsYet', 'No sets yet');

  const newSet = useCallback(() => navigation.navigate('CreateSet', { folderId }), [navigation, folderId]);

  const handleDeleteSet = useCallback((set: StudySet) => {
    const count = set._count?.cards ?? 0;
    show({
      title: t('library:qm.deleteSetTitle', 'Delete this set?'),
      message: t('library:qm.deleteSetMessage', { title: set.title, count }),
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

  const handleDeleteFolder = useCallback(() => {
    show({
      title: t('library:qm.deleteFolderTitle', 'Delete this folder?'),
      message: t('library:qm.deleteFolderMessage', 'The sets inside stay in your library. Only the folder goes.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFolderAsync(folderId);
          Toast.show({ type: 'success', text1: t('library:folders.folderDeleted', 'Folder deleted') });
          navigation.goBack();
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  }, [show, deleteFolderAsync, folderId, navigation, t]);

  const folderActions = useMemo<QMSheetAction[]>(() => [
    { label: t('library:qm.editFolder', 'Edit folder'), icon: PencilIcon, onPress: () => folder && folderModal.openEditModal(folder) },
    { label: t('library:qm.deleteFolder', 'Delete folder'), icon: TrashIcon, danger: true, onPress: handleDeleteFolder },
  ], [folder, folderModal, handleDeleteFolder, t]);

  const renderItem = useCallback(({ item, index }: { item: StudySet; index: number }) => {
    const count = item._count?.cards ?? 0;
    return (
      <Animated.View entering={qmRowEnter(index)} style={styles.rowPad}>
        <QMSetRow
          title={item.title}
          color={item.color}
          meta={`${t('library:cards.cardCount', { count })} · ${formatDate(item.updatedAt)}`}
          onPress={() => navigation.navigate('SetDetail', { setId: item.id, setTitle: item.title })}
          onMenu={() => setSelectedSet(item)}
          menuLabel={t('library:qm.optionsFor', { name: item.title })}
        />
      </Animated.View>
    );
  }, [navigation, t]);

  const header = (
    <View>
      <View style={[styles.hero, { backgroundColor: heroBg, paddingTop: insets.top + HERO_TOP }]}>
        <View style={styles.flex}>
          <Typography preset="qmPageTitle" color={qm.ink}>{folderName}</Typography>
          <Typography preset="qmBody" color={qm.body} style={styles.heroMeta}>{folderMeta}</Typography>
        </View>
        <Svg width={HERO_ICON_W} height={HERO_ICON_H} viewBox="0 0 34 30">
          <Path d="M2 6a4 4 0 0 1 4-4h7l4 4h11a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" fill={frost} stroke={heroInk} strokeWidth={1.4} />
        </Svg>
      </View>
      {sets.length > 0 && (
        <View style={styles.searchWrap}>
          <QMSearchField
            value={search}
            onChangeText={setSearch}
            placeholder={t('library:qm.searchIn', { name: folderName, defaultValue: `Search sets in ${folderName}` })}
          />
        </View>
      )}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) {
    empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  } else if (failed) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={RefreshIcon}
        title={t('library:qm.folderFailedTitle', 'This folder did not load')}
        text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
        action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: onRefresh }}
      />
    );
  } else if (!sets.length) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={FolderIcon}
        title={t('library:qm.folderEmptyTitle', 'This folder is empty')}
        text={t('library:qm.folderEmptyText', 'Add a new set here, or move one in from your library with “Move to folder”.')}
      />
    );
  } else if (!filtered.length) {
    empty = (
      <QMEmpty
        style={styles.emptyGap}
        icon={SearchIcon}
        title={t('library:qm.noSetsMatch', 'No sets match')}
        text={t('library:qm.noMatchIn', { query: search.trim(), name: folderName, defaultValue: `Nothing called “${search.trim()}” in ${folderName}.` })}
        action={{ label: t('library:qm.clearSearch', 'Clear search'), onPress: () => setSearch('') }}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isLoading || failed ? [] : filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable onPress={navigation.goBack} style={({ pressed }) => [styles.round, { backgroundColor: frost }, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('common:actions.back', 'Back')}>
          <ChevronLeftIcon size={20} color={qm.ink} />
        </Pressable>
        <Pressable onPress={() => setFolderMenu(true)} style={({ pressed }) => [styles.round, { backgroundColor: frost }, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('library:qm.folderOptions', 'Folder options')}>
          <MoreVerticalIcon size={20} color={qm.ink} />
        </Pressable>
      </View>

      <View style={[styles.ctaWrap, { backgroundColor: qm.bg }]}>
        <AnimatedPressable scaleTo={0.97} onPress={newSet} style={[styles.cta, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
          <PlusIcon size={18} color={qm.onViolet} strokeWidth={2} />
          <Typography preset="qmButtonLg" color={qm.onViolet}>{t('library:qm.newSetInFolder', 'New set in this folder')}</Typography>
        </AnimatedPressable>
      </View>

      <SetActionSheet
        set={selectedSet}
        visible={!!selectedSet}
        onClose={() => setSelectedSet(null)}
        onQuiz={() => selectedSet && setQuizSet({ id: selectedSet.id, title: selectedSet.title })}
        onCreateCard={() => selectedSet && navigation.navigate('CreateCard', { setId: selectedSet.id })}
        showAssignFolder
        folderName={folderName}
        onAssignFolder={() => setAssignTarget(selectedSet)}
        onEdit={() => selectedSet && navigation.navigate('EditSet', { setId: selectedSet.id })}
        onDelete={() => selectedSet && handleDeleteSet(selectedSet)}
      />

      <MoveToFolderSheet set={assignTarget} onClose={() => setAssignTarget(null)} />

      <QuizModeSheet
        visible={!!quizSet}
        setIds={quizSet ? [quizSet.id] : []}
        setTitles={quizSet ? [quizSet.title] : []}
        onClose={() => setQuizSet(null)}
        onStart={(mode, ids, titles) => navigation.navigate('Quiz', { setIds: ids, setTitles: titles, mode })}
      />

      <QMSheet
        visible={folderMenu}
        onClose={() => setFolderMenu(false)}
        title={t('library:qm.folderOptions', 'Folder options')}
        sub={folderName}
        actions={folderActions}
      />

      <FolderFormSheet modal={folderModal} />
      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  content: { paddingBottom: spacing.xxxl },
  hero: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
    marginBottom: spacing.s18,
  },
  heroMeta: { marginTop: spacing.s6 },
  searchWrap: { paddingHorizontal: spacing.xl, marginBottom: spacing.s14 },
  rowPad: { paddingHorizontal: spacing.xl },
  sep: { height: spacing.s10 },
  loading: { marginTop: spacing.huge },
  emptyGap: { marginTop: spacing.huge, marginHorizontal: spacing.xl },
  topBar: { position: 'absolute', left: spacing.s10, right: spacing.s10, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  ctaWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  cta: { height: CTA_H, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
