import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { type Note, NOTE_PREDEFINED_TAGS } from '../../types';
import { useNotes, useDeleteNote, useConfirmDialog } from '../../hooks';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CloseCircleIcon, PlusIcon, SearchIcon, SwapIcon } from '../../components/icons';
import { getErrorMessage } from '../../api/client';
import { fontSizes, fontWeights, layout, shadows, spacing, useTheme } from '../../theme';

const FAB_SIZE = 56;
const SEARCH_ICON_SIZE = 18;

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
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const { data: notes = [], isLoading, isFetching, error, refetch } = useNotes();
  const deleteNote = useDeleteNote();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

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
    <Pressable
      style={({ pressed }) => [styles.noteCard, pressed && styles.noteCardPressed]}
      onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
      onLongPress={() => handleDelete(item)}
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
  ), [navigation, handleDelete, colors, styles]);

  if (error) return <ErrorState message="Could not load notes" onRetry={refetch} />;

  return (
    <Screen
      header={
        <ScreenHeader
          title="My Notes"
          onBack={() => navigation.goBack()}
          right={
            <Pressable style={styles.sortBtn} onPress={cycleSortOrder} hitSlop={8}>
              <SwapIcon size={16} color={colors.textSecondary} />
              <Typography preset="caption" color={colors.textSecondary}>
                {SORT_LABELS[sortOrder]}
              </Typography>
            </Pressable>
          }
        />
      }
    >
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <SearchIcon size={SEARCH_ICON_SIZE} color={colors.textDisabled} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {Platform.OS === 'android' && search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <CloseCircleIcon size={18} color={colors.textDisabled} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tag filter bar */}
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

      {/* FAB */}
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
    searchRow: {
      marginHorizontal: layout.screenPaddingH,
      marginTop: spacing[3],
      marginBottom: spacing[2],
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing[3],
      height: 44,
    },
    searchIcon: { marginRight: spacing[2] },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: fontSizes.md,
      paddingVertical: 0,
    },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1],
    },
    tagBarWrap: { height: 40, marginBottom: spacing[2] },
    tagBar: { paddingHorizontal: layout.screenPaddingH, alignItems: 'center', gap: spacing[2] },
    tagFilterPill: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    tagFilterPillActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    list: { paddingHorizontal: layout.screenPaddingH, paddingBottom: FAB_SIZE + spacing[8], flexGrow: 1 },
    separator: { height: spacing[3] },
    noteCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: spacing[4],
      gap: spacing[1],
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
      borderRadius: 20,
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
  });
}
