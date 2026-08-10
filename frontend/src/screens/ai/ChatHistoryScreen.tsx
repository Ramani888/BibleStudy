import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  PencilIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from '../../components/icons';
import Toast from 'react-native-toast-message';

import {
  ActionSheet,
  AppModal,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingOverlay,
} from '../../components/feedback';
import { Button, ScreenHeader, SearchBar, Spacer, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import {
  useAIChatHistory,
  useBookmarks,
  useClearHistory,
  useConfirmDialog,
  useDeleteSession,
  useRenameSession,
  useUpdateSessionTags,
} from '../../hooks';
import { useAIChatStore } from '../../store';
import { useTheme, fontSizes, layout, spacing } from '../../theme';
import type { BookmarkedChat, ChatSession } from '../../types';
import type { AIScreenProps } from '../../navigation/types';
import { BookmarkCard, SessionCard } from './components/ChatHistoryCards';

const PREDEFINED_TAGS = [
  'Theology', 'Old Testament', 'New Testament',
  'Prayer', 'History', 'Devotional', 'Prophecy',
] as const;

const ListSeparator = () => <Spacer size={spacing.md} />;

export function ChatHistoryScreen({ navigation }: AIScreenProps<'ChatHistory'>) {
  const { colors } = useTheme();
  const {
    data,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAIChatHistory();

  const {
    data: bookmarksData,
    isLoading: isBookmarksLoading,
    isRefetching: isBookmarksRefetching,
    refetch: refetchBookmarks,
  } = useBookmarks();

  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession();
  const { mutate: clearHistory, isPending: isClearingHistory } = useClearHistory();
  const { mutate: renameSession, isPending: isRenaming } = useRenameSession();
  const { mutate: updateTags, isPending: isUpdatingTags } = useUpdateSessionTags();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const [viewMode, setViewMode] = useState<'all' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery('');
    setActiveTag(null);
  }, [viewMode]);

  const [sheet, setSheet] = useState<{ visible: boolean; session: ChatSession | null }>({
    visible: false,
    session: null,
  });

  const [renameModal, setRenameModal] = useState<{ visible: boolean; session: ChatSession | null; value: string }>({
    visible: false,
    session: null,
    value: '',
  });

  const [tagsModal, setTagsModal] = useState<{ visible: boolean; session: ChatSession | null; selected: string[] }>({
    visible: false,
    session: null,
    selected: [],
  });

  const allSessions = data?.pages.flatMap(p => p.sessions) ?? [];
  const allBookmarks = bookmarksData?.bookmarks ?? [];

  const filteredSessions = allSessions.filter(s => {
    const matchesSearch = searchQuery.trim() === '' ||
      (s.customTitle || s.title).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = activeTag === null || s.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const handleContinue = useCallback((session: ChatSession) => {
    useAIChatStore.getState().loadSession(session);
    navigation.navigate('AIChat');
  }, [navigation]);

  const handleLongPress = useCallback((session: ChatSession) => {
    if (!session.sessionId) {
      Toast.show({
        type: 'info',
        text1: 'Cannot manage this conversation',
        text2: 'Legacy messages cannot be renamed or deleted.',
      });
      return;
    }
    setSheet({ visible: true, session });
  }, []);

  const handleDeleteSession = () => {
    if (!sheet.session?.sessionId) return;
    const sessionId = sheet.session.sessionId;
    showConfirm({
      title: 'Delete Conversation',
      message: 'This conversation and all its messages will be permanently deleted.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        deleteSession(sessionId, {
          onSuccess: () => Toast.show({ type: 'success', text1: 'Conversation deleted' }),
          onError: () => Toast.show({ type: 'error', text1: 'Failed to delete' }),
        });
      },
    });
  };

  const handleClearAll = () => {
    if (allSessions.length === 0) return;
    showConfirm({
      title: 'Clear All History',
      message: 'All conversations and messages will be permanently deleted. This cannot be undone.',
      confirmLabel: 'Clear All',
      variant: 'danger',
      onConfirm: () => {
        clearHistory(undefined, {
          onSuccess: () => Toast.show({ type: 'success', text1: 'History cleared' }),
          onError: () => Toast.show({ type: 'error', text1: 'Failed to clear history' }),
        });
      },
    });
  };

  const handleOpenRename = () => {
    if (!sheet.session) return;
    setRenameModal({
      visible: true,
      session: sheet.session,
      value: sheet.session.customTitle || sheet.session.title,
    });
  };

  const handleSaveRename = () => {
    if (!renameModal.session?.sessionId || !renameModal.value.trim()) return;
    renameSession(
      { sessionId: renameModal.session.sessionId, title: renameModal.value.trim() },
      {
        onSuccess: () => {
          setRenameModal({ visible: false, session: null, value: '' });
          Toast.show({ type: 'success', text1: 'Renamed successfully' });
        },
        onError: () => Toast.show({ type: 'error', text1: 'Failed to rename' }),
      },
    );
  };

  const handleOpenTags = () => {
    if (!sheet.session) return;
    setTagsModal({
      visible: true,
      session: sheet.session,
      selected: sheet.session.tags ?? [],
    });
  };

  const handleToggleTag = (tag: string) => {
    setTagsModal(prev => ({
      ...prev,
      selected: prev.selected.includes(tag)
        ? prev.selected.filter(t => t !== tag)
        : [...prev.selected, tag],
    }));
  };

  const handleSaveTags = () => {
    if (!tagsModal.session?.sessionId) return;
    updateTags(
      { sessionId: tagsModal.session.sessionId, tags: tagsModal.selected },
      {
        onSuccess: () => {
          setTagsModal({ visible: false, session: null, selected: [] });
          Toast.show({ type: 'success', text1: 'Tags updated' });
        },
        onError: () => Toast.show({ type: 'error', text1: 'Failed to update tags' }),
      },
    );
  };

  const sheetActions = [
    { label: 'Rename', icon: PencilIcon, onPress: handleOpenRename, disabled: !sheet.session?.sessionId },
    { label: 'Edit Tags', icon: TagIcon, onPress: handleOpenTags, disabled: !sheet.session?.sessionId },
    { label: 'Delete', icon: TrashIcon, onPress: handleDeleteSession, destructive: true, disabled: !sheet.session?.sessionId || isDeleting },
  ];

  const renderSession = useCallback(({ item }: { item: ChatSession }) => (
    <SessionCard session={item} onLongPress={handleLongPress} onContinue={handleContinue} />
  ), [handleLongPress, handleContinue]);

  const renderBookmark = useCallback(({ item }: { item: BookmarkedChat }) => (
    <BookmarkCard chat={item} />
  ), []);

  if (isError) return <ErrorState message="Could not load history." onRetry={refetch} />;

  const hasAnyTaggedSession = allSessions.some(s => s.tags?.length > 0);

  return (
    <Screen header={<ScreenHeader title="Chat History" onBack={() => navigation.goBack()} />}>

      {/* ── View Mode Toggle ── */}
      <View style={[styles.modeToggle, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.modeTab, viewMode === 'all' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setViewMode('all')}
        >
          <Typography preset="label" color={viewMode === 'all' ? colors.accent : colors.textSecondary}>
            All
          </Typography>
        </Pressable>
        <Pressable
          style={[styles.modeTab, viewMode === 'bookmarked' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setViewMode('bookmarked')}
        >
          <StarIcon size={14} color={viewMode === 'bookmarked' ? colors.accent : colors.textSecondary} />
          <Typography preset="label" color={viewMode === 'bookmarked' ? colors.accent : colors.textSecondary}>
            Bookmarked
          </Typography>
        </Pressable>
      </View>

      {viewMode === 'all' && (
        <View>
        <>
          <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <SearchBar
              placeholder="Search conversations…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchBarContainer}
            />
            {allSessions.length > 0 && (
              <Pressable onPress={handleClearAll} hitSlop={8} style={styles.clearBtn}>
                <TrashIcon size={18} color={colors.alert} />
              </Pressable>
            )}
          </View>

          {hasAnyTaggedSession && (
            <View style={[styles.tagBarWrapper, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagBar}>
                <Pressable
                  style={[styles.tagFilter, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, activeTag === null && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => setActiveTag(null)}
                >
                  <Typography preset="caption" color={activeTag === null ? colors.textOnAccent : colors.textSecondary}>
                    All
                  </Typography>
                </Pressable>
                {PREDEFINED_TAGS.map(tag => (
                  <Pressable
                    key={tag}
                    style={[styles.tagFilter, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, activeTag === tag && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                    onPress={() => setActiveTag(prev => prev === tag ? null : tag)}
                  >
                    <Typography preset="caption" color={activeTag === tag ? colors.textOnAccent : colors.textSecondary}>
                      {tag}
                    </Typography>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </>
        </View>
      )}

      {viewMode === 'bookmarked' ? (
        <View style={styles.fill}>
        <FlatList
          style={styles.fill}
          data={allBookmarks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isBookmarksRefetching}
          onRefresh={refetchBookmarks}
          ItemSeparatorComponent={ListSeparator}
          ListEmptyComponent={
            !isBookmarksLoading ? (
              <EmptyState title="No bookmarks yet" subtitle="Long-press any AI response and tap Bookmark to save it here" />
            ) : (
              <View style={styles.loadingWrap}><ActivityIndicator color={colors.accent} /></View>
            )
          }
          renderItem={renderBookmark}
        />
        </View>
      ) : (
        <View style={styles.fill}>
        <FlatList
          style={styles.fill}
          data={filteredSessions}
          keyExtractor={(item) => item.sessionId ?? item.messages[0]?.id ?? 'unknown'}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          ItemSeparatorComponent={ListSeparator}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState
                title={searchQuery ? 'No results found' : 'No chat history yet'}
                subtitle={searchQuery ? 'Try a different search term' : 'Your conversations with the AI assistant will appear here'}
              />
            ) : (
              <View style={styles.loadingWrap}><ActivityIndicator color={colors.accent} /></View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}><ActivityIndicator color={colors.accent} size="small" /></View>
            ) : null
          }
          renderItem={renderSession}
        />
        </View>
      )}

      <ActionSheet
        visible={sheet.visible}
        title="Conversation"
        actions={sheetActions}
        onClose={() => setSheet({ visible: false, session: null })}
      />

      <AppModal
        visible={renameModal.visible}
        title="Rename Conversation"
        onClose={() => setRenameModal({ visible: false, session: null, value: '' })}
        showHandle
      >
        <TextInput
          style={[styles.renameInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          value={renameModal.value}
          onChangeText={v => setRenameModal(prev => ({ ...prev, value: v }))}
          placeholder="Conversation name…"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          maxLength={200}
        />
        <Button
          label={isRenaming ? 'Saving…' : 'Save'}
          onPress={handleSaveRename}
          disabled={!renameModal.value.trim() || isRenaming}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </AppModal>

      <AppModal
        visible={tagsModal.visible}
        title="Edit Tags"
        onClose={() => setTagsModal({ visible: false, session: null, selected: [] })}
        showHandle
      >
        <View style={styles.tagGrid}>
          {PREDEFINED_TAGS.map(tag => {
            const active = tagsModal.selected.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[styles.tagOption, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                onPress={() => handleToggleTag(tag)}
              >
                <Typography preset="bodySm" color={active ? colors.textOnAccent : colors.textPrimary}>
                  {tag}
                </Typography>
              </Pressable>
            );
          })}
        </View>
        <Button
          label={isUpdatingTags ? 'Saving…' : 'Save Tags'}
          onPress={handleSaveTags}
          disabled={isUpdatingTags}
          fullWidth
          style={{ marginTop: spacing.lg }}
        />
      </AppModal>

      <LoadingOverlay visible={isDeleting || isClearingHistory} />
      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  modeToggle: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBarContainer: { flex: 1, marginBottom: 0 },
  clearBtn: { padding: spacing.xs },

  tagBarWrapper: { borderBottomWidth: 1 },
  tagBar: { paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.sm, gap: spacing.sm },
  tagFilter: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius, borderWidth: 1,
  },

  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge, flexGrow: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.s80 },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },

  renameInput: {
    borderWidth: 1.5, borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: fontSizes.md,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagOption: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: layout.pillRadius, borderWidth: 1,
  },
});
