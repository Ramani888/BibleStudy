import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { type Note, NOTE_PREDEFINED_TAGS } from '../../types';
import { useNotes, useDeleteNote, useConfirmDialog } from '../../hooks';
import { formatRelativeShort } from '../../utils/formatters';
import { QMBackButton, QMButton, QMConfirmDialog, QMEmpty, QMSearchField, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { DocIcon, InfoIcon, PencilIcon, SearchIcon, SortIcon, TrashIcon } from '../../components/icons';
import { getErrorMessage } from '../../api/client';
import { radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'Notes'>;
type SortOrder = 'newest' | 'alpha' | 'oldest';

const SORT_NEXT: Record<SortOrder, SortOrder> = { newest: 'alpha', alpha: 'oldest', oldest: 'newest' };
const SORT_KEY: Record<SortOrder, string> = { newest: 'sortRecent', alpha: 'sortAlpha', oldest: 'sortOldest' };
const CHIP_H = 36;
const DELETE_W = 84;

export function NotesScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: notes = [], isLoading, isFetching, isError, refetch } = useNotes();
  const deleteNote = useDeleteNote();
  const { show, dialogProps } = useConfirmDialog();
  const openRow = useRef<Swipeable | null>(null);

  const q = search.trim().toLowerCase();
  const sorted = useMemo(() => notes
    .filter(n => (!q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) && (!activeTag || n.tags.includes(activeTag)))
    .sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      const d = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return sortOrder === 'oldest' ? -d : d;
    }), [notes, q, activeTag, sortOrder]);

  // A topic filter whose last note was deleted would leave an empty list with no way back.
  useEffect(() => {
    if (activeTag && !notes.some(n => n.tags.includes(activeTag))) setActiveTag(null);
  }, [notes, activeTag]);

  const handleDelete = useCallback((note: Note) => {
    openRow.current?.close();
    show({
      title: t('profile:qmNotes.deleteTitle'),
      message: t('profile:qmNotes.deleteText', { title: note.title }),
      confirmLabel: t('profile:qmNotes.delete'),
      cancelLabel: t('profile:qmNotes.keep'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteNote.mutateAsync(note.id);
          Toast.show({ type: 'success', text1: t('profile:qmNotes.deleted') });
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [show, deleteNote, t]);

  const renderItem = useCallback(({ item, index }: { item: Note; index: number }) => {
    let self: Swipeable | null = null;
    return (
      <Animated.View entering={qmRowEnter(index)} style={[styles.cell, { backgroundColor: qm.error }]}>
        <Swipeable
          ref={r => { self = r; }}
          onSwipeableOpen={() => {
            if (openRow.current && openRow.current !== self) openRow.current.close();
            openRow.current = self;
          }}
          renderRightActions={() => (
            <Pressable onPress={() => handleDelete(item)} style={({ pressed }) => [styles.delete, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('profile:qmNotes.delete')}>
              <TrashIcon size={20} color={qm.onDanger} />
              <Typography preset="qmChip" color={qm.onDanger}>{t('profile:qmNotes.delete')}</Typography>
            </Pressable>
          )}
        >
          <AnimatedPressable
            scaleTo={0.99}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            style={[styles.card, { backgroundColor: qm.surface }]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.cardHead}>
              <Typography preset="qmRowTitle" color={qm.ink} numberOfLines={2} style={styles.flex}>{item.title}</Typography>
              <Typography preset="qmFine" color={qm.muted} numberOfLines={1} style={styles.when}>{formatRelativeShort(item.updatedAt)}</Typography>
            </View>
            <Typography preset="qmBody" color={qm.body} numberOfLines={2} style={styles.body}>{item.body}</Typography>
            {item.tags.length > 0 && (
              <View style={styles.tags}>
                {item.tags.map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: qm.goldBg }]}>
                    <Typography preset="qmChip" color={qm.goldText}>{tag}</Typography>
                  </View>
                ))}
              </View>
            )}
          </AnimatedPressable>
        </Swipeable>
      </Animated.View>
    );
  }, [qm, navigation, handleDelete, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <View style={styles.topRow}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmNotes.back')} />
        <AnimatedPressable
          scaleTo={0.96}
          onPress={() => setSortOrder(s => SORT_NEXT[s])}
          style={[styles.sort, { backgroundColor: qm.field }]}
          accessibilityRole="button"
          accessibilityLabel={t('profile:qmNotes.sortA11y', { label: t(`profile:qmNotes.${SORT_KEY[sortOrder]}`) })}
        >
          <SortIcon size={14} color={qm.body} strokeWidth={2.2} />
          <Typography preset="qmChip" color={qm.body}>{t(`profile:qmNotes.${SORT_KEY[sortOrder]}`)}</Typography>
        </AnimatedPressable>
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmNotes.title')}</Typography>
      {notes.length > 0 && (
        <>
          <QMSearchField value={search} onChangeText={setSearch} placeholder={t('profile:qmNotes.search')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
            {[null, ...NOTE_PREDEFINED_TAGS].map(tag => {
              const on = activeTag === tag;
              return (
                <AnimatedPressable
                  key={tag ?? 'all'}
                  scaleTo={0.96}
                  onPress={() => setActiveTag(tag === null || on ? null : tag)}
                  style={[styles.chip, { backgroundColor: on ? qm.violet : qm.surface, boxShadow: on ? undefined : qm.cardShadow }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Typography preset="qmLink" color={on ? qm.onViolet : qm.body}>{tag ?? t('profile:qmNotes.all')}</Typography>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </>
      )}
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmNotes.loadFailed')} action={{ label: t('profile:qmNotes.tryAgain'), onPress: () => refetch() }} />;
  else if (notes.length === 0) empty = <QMEmpty icon={DocIcon} title={t('profile:qmNotes.emptyTitle')} text={t('profile:qmNotes.emptyText')} />;
  else {
    empty = (
      <QMEmpty
        icon={SearchIcon}
        title={t('profile:qmNotes.noMatchTitle', { query: search.trim() || activeTag || '' })}
        text={t('profile:qmNotes.noMatchText')}
        action={{ label: t('profile:qmNotes.clear'), onPress: () => { setSearch(''); setActiveTag(null); } }}
      />
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isError ? [] : sorted}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={sorted.length > 0
          ? <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.hint}>{t('profile:qmNotes.swipeHint')}</Typography>
          : null}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
      {!isLoading && !isError && (
        <View style={[styles.footer, { backgroundColor: qm.bg }]}>
          <QMButton icon={PencilIcon} label={t('profile:qmNotes.write')} onPress={() => navigation.navigate('NoteEditor', {})} />
        </View>
      )}
      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.7 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sort: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, height: 38, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  h1: { marginTop: spacing.s6, marginBottom: spacing.md },
  chipScroll: { marginTop: spacing.md, marginHorizontal: -spacing.xl },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  chip: { height: CHIP_H, paddingHorizontal: spacing.s14, borderRadius: radius.pill, justifyContent: 'center' },
  listGap: { height: spacing.md },
  loading: { marginTop: spacing.xxxl },
  cell: { borderRadius: radius.r20, overflow: 'hidden' },
  card: { padding: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10 },
  when: { marginTop: spacing.s3 },
  body: { marginTop: spacing.s6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s6, marginTop: spacing.s10 },
  tag: { borderRadius: radius.pill, paddingVertical: spacing.xs, paddingHorizontal: spacing.s10 },
  delete: { width: DELETE_W, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  sep: { height: spacing.s10 },
  hint: { marginTop: spacing.lg, marginHorizontal: spacing.s6 },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
});
