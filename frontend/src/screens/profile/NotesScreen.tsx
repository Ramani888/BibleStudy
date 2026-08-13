import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
Platform } from 'react-native';
import Toast from 'react-native-toast-message';

import type { RootScreenProps } from '../../navigation/types';
import { type Note, NOTE_PREDEFINED_TAGS } from '../../types';
import { useNotes, useDeleteNote, useConfirmDialog, useSearchToggle } from '../../hooks';
import { SearchBar } from '../../components/ui/SearchBar';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PlusIcon, SearchIcon, SwapIcon, TrashIcon } from '../../components/icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { getErrorMessage } from '../../api/client';
import { CARD_FILL_LIGHT, fontWeights, layout, spacing, useTheme, palette } from '../../theme';

const FAB_SIZE = 56;

type SortOrder = 'newest' | 'oldest' | 'alpha';

const SORT_LABELS: Record<SortOrder, string> = {
  newest: 'Recent',
  alpha: 'A–Z',
  oldest: 'Oldest',
};

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

type Props = RootScreenProps<'Notes'>;

export function NotesScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: notes = [], isLoading, isFetching, error, refetch } = useNotes();
  const deleteNote = useDeleteNote();
  const { show: showConfirm, dialogProps } = useConfirmDialog();
  const openRow = useRef<Swipeable | null>(null);

  const cycleSortOrder = useCallback(() =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'oldest' : 'newest'), []);

  const filtered = useMemo(
    () => notes.filter(n => {
      const matchesSearch = !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.body.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !activeTag || n.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    }),
    [notes, search, activeTag],
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => {
      if (sortOrder === 'alpha')  return a.title.localeCompare(b.title);
      if (sortOrder === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }),
    [filtered, sortOrder],
  );

  const hasTaggedNotes = notes.some(n => n.tags.length > 0);

  useEffect(() => {
    if (activeTag && !notes.some(n => n.tags.includes(activeTag))) setActiveTag(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const handleDelete = useCallback((note: Note) => {
    showConfirm({
      title: 'Delete Note',
      message: `Delete "${note.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteNote.mutateAsync(note.id);
          Toast.show({ type: 'success', text1: 'Note deleted' });
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [showConfirm, deleteNote]);

  const renderItem = useCallback(({ item }: { item: Note }) => (
    <Swipeable
      renderRightActions={() => (
        <Pressable style={[styles.deleteAction, { backgroundColor: colors.alert }]} onPress={() => handleDelete(item)}>
          <TrashIcon size={20} color={palette.white} />
        </Pressable>
      )}
      onSwipeableOpen={(_, swipeable) => {
        if (openRow.current && openRow.current !== swipeable) {
          openRow.current.close();
        }
        openRow.current = swipeable;
      }}
    >
      <Pressable
        style={({ pressed }) => [styles.noteCard, { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, !isDark && styles.noteCardShadow, pressed && styles.noteCardPressed]}
        onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
      >
        <View style={styles.noteHeader}>
          <Typography preset="label" style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Typography>
          <Typography preset="caption" color={colors.textDisabled}>
            {formatRelativeDate(item.updatedAt)}
          </Typography>
        </View>
        <Typography preset="caption" color={colors.textSecondary} numberOfLines={2}>
          {item.body}
        </Typography>
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.map(tag => (
              <View key={tag} style={[styles.tagPill, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
                <Typography preset="caption" color={colors.accent}>{tag}</Typography>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Swipeable>
  ), [navigation, handleDelete, colors]);

  if (error) return <ErrorState message="Could not load notes" onRetry={refetch} />;

  return (
    <Screen
      header={
        <ScreenHeader
          title="My Notes"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <Pressable onPress={toggleSearch} hitSlop={8}>
                <SearchIcon size={20} color={searchVisible ? colors.accent : colors.textSecondary} />
              </Pressable>
              <Pressable style={styles.sortBtn} onPress={cycleSortOrder} hitSlop={8}>
                <SwapIcon size={16} color={colors.textSecondary} />
                <Typography preset="caption" color={colors.textSecondary}>
                  {SORT_LABELS[sortOrder]}
                </Typography>
              </Pressable>
            </View>
          }
        />
      }
    >
      <View>
      {searchVisible && (
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Search notes…"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {hasTaggedNotes && (
        <View style={styles.tagBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagBar}>
            <Pressable
              style={[styles.tagFilterPill, { borderColor: !activeTag ? colors.accent : colors.border, backgroundColor: !activeTag ? colors.accentSoft : colors.background }]}
              onPress={() => setActiveTag(null)}
            >
              <Typography preset="caption" color={!activeTag ? colors.accent : colors.textSecondary}>All</Typography>
            </Pressable>
            {NOTE_PREDEFINED_TAGS.map(tag => (
              <Pressable
                key={tag}
                style={[styles.tagFilterPill, { borderColor: activeTag === tag ? colors.accent : colors.border, backgroundColor: activeTag === tag ? colors.accentSoft : colors.background }]}
                onPress={() => setActiveTag(prev => (prev === tag ? null : tag))}
              >
                <Typography preset="caption" color={activeTag === tag ? colors.accent : colors.textSecondary}>
                  {tag}
                </Typography>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      </View>

      <View style={{ flex: 1 }}>
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState title="No notes yet" subtitle="Tap + to write your first note" />
          )
        }
      />

      </View>

      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent }, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('NoteEditor', {})}
      >
        <PlusIcon size={28} color={colors.textOnAccent} />
      </Pressable>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  searchWrap: {
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  tagBarWrap: { height: 40, marginBottom: spacing.sm },
  tagBar: { paddingHorizontal: layout.screenPaddingH, alignItems: 'center', gap: spacing.sm },
  tagFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius,
    borderWidth: 1,
  },
  list: { paddingHorizontal: layout.screenPaddingH, paddingBottom: FAB_SIZE + spacing.xxxl, flexGrow: 1, paddingTop: spacing.md, gap: spacing.lg },
  noteCard: {
    borderRadius: layout.cardRadiusSm,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noteCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  noteCardPressed: { opacity: 0.7 },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  noteTitle: { flex: 1, fontWeight: fontWeights.semiBold },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tagPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius,
    borderWidth: 1,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxxl,
    right: layout.screenPaddingH,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 8 }, default: {} }),
  },
  fabPressed: { opacity: 0.85 },
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.cardRadiusSm,
    marginLeft: spacing.sm,
  },
});
