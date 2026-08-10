import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
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
import { fontWeights, layout, shadows, spacing, useTheme } from '../../theme';

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

type Props = ProfileScreenProps<'Notes'>;

export function NotesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: notes = [], isLoading, isFetching, error, refetch } = useNotes();
  const deleteNote = useDeleteNote();
  const { show: showConfirm, dialogProps } = useConfirmDialog();
  const openRow = useRef<Swipeable | null>(null);

  const cycleSortOrder = () =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'oldest' : 'newest');

  const filtered = notes.filter(n => {
    const matchesSearch = !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || n.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'alpha')  return a.title.localeCompare(b.title);
    if (sortOrder === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

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
        <Pressable style={styles.deleteAction} onPress={() => handleDelete(item)}>
          <TrashIcon size={20} color="#fff" />
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
        style={({ pressed }) => [styles.noteCard, pressed && styles.noteCardPressed]}
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
              <View key={tag} style={styles.tagPill}>
                <Typography preset="caption" color={colors.primary}>{tag}</Typography>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    </Swipeable>
  ), [navigation, handleDelete, colors, styles]);

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
                <SearchIcon size={20} color={searchVisible ? colors.primary : colors.textSecondary} />
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
              style={[styles.tagFilterPill, !activeTag && styles.tagFilterPillActive]}
              onPress={() => setActiveTag(null)}
            >
              <Typography preset="caption" color={!activeTag ? colors.primary : colors.textSecondary}>All</Typography>
            </Pressable>
            {NOTE_PREDEFINED_TAGS.map(tag => (
              <Pressable
                key={tag}
                style={[styles.tagFilterPill, activeTag === tag && styles.tagFilterPillActive]}
                onPress={() => setActiveTag(prev => (prev === tag ? null : tag))}
              >
                <Typography preset="caption" color={activeTag === tag ? colors.primary : colors.textSecondary}>
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState title="No notes yet" subtitle="Tap + to write your first note" />
          )
        }
      />

      </View>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('NoteEditor', {})}
      >
        <PlusIcon size={28} color={colors.textOnPrimary} />
      </Pressable>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    searchWrap: {
      marginHorizontal: layout.screenPaddingH,
      marginTop: spacing[2],
      marginBottom: spacing[1],
    },
    tagBarWrap: { height: 40, marginBottom: spacing[2] },
    tagBar: { paddingHorizontal: layout.screenPaddingH, alignItems: 'center', gap: spacing[2] },
    tagFilterPill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: layout.pillRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    tagFilterPillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    list: { paddingHorizontal: layout.screenPaddingH, paddingBottom: FAB_SIZE + spacing[8], flexGrow: 1, paddingTop: spacing[3] },
    separator: { height: spacing[3] },
    noteCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: layout.cardRadiusSm,
      padding: spacing[4],
      gap: spacing[1],
      ...shadows.sm,
    },
    noteCardPressed: { opacity: 0.7 },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[2],
    },
    noteTitle: { flex: 1, fontWeight: fontWeights.semiBold },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1], marginTop: spacing[1] },
    tagPill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: layout.pillRadius,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    fab: {
      position: 'absolute',
      bottom: spacing[8],
      right: layout.screenPaddingH,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.lg,
    },
    fabPressed: { opacity: 0.85 },
    deleteAction: {
      width: 72,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error,
      borderRadius: layout.cardRadiusSm,
      marginLeft: spacing[2],
    },
  });
}
