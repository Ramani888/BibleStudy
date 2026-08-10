import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useTheme, fontSizes, layout, spacing, type Theme } from '../../theme';
import type { BookmarkedChat, ChatSession } from '../../types';
import type { AIScreenProps } from '../../navigation/types';
import { BookmarkCard, SessionCard } from './components/ChatHistoryCards';

const PREDEFINED_TAGS = [
  'Theology', 'Old Testament', 'New Testament',
  'Prayer', 'History', 'Devotional', 'Prophecy',
] as const;

const ListSeparator = () => <Spacer size={spacing[3]} />;

export function ChatHistoryScreen({ navigation }: AIScreenProps<'ChatHistory'>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeTab, viewMode === 'all' && styles.modeTabActive]}
          onPress={() => setViewMode('all')}
        >
          <Typography preset="label" color={viewMode === 'all' ? colors.primary : colors.textSecondary}>
            All
          </Typography>
        </Pressable>
        <Pressable
          style={[styles.modeTab, viewMode === 'bookmarked' && styles.modeTabActive]}
          onPress={() => setViewMode('bookmarked')}
        >
          <StarIcon size={14} color={viewMode === 'bookmarked' ? colors.primary : colors.textSecondary} />
          <Typography preset="label" color={viewMode === 'bookmarked' ? colors.primary : colors.textSecondary}>
            Bookmarked
          </Typography>
        </Pressable>
      </View>

      {viewMode === 'all' && (
        <>
          <View style={styles.topBar}>
            <SearchBar
              placeholder="Search conversations…"
              value={searchQuery}
              onChangeText={setSearchQuery}
              containerStyle={styles.searchBarContainer}
            />
            {allSessions.length > 0 && (
              <Pressable onPress={handleClearAll} hitSlop={8} style={styles.clearBtn}>
                <TrashIcon size={18} color={colors.error} />
              </Pressable>
            )}
          </View>

          {hasAnyTaggedSession && (
            <View style={styles.tagBarWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagBar}>
                <Pressable
                  style={[styles.tagFilter, activeTag === null && styles.tagFilterActive]}
                  onPress={() => setActiveTag(null)}
                >
                  <Typography preset="caption" color={activeTag === null ? colors.textOnPrimary : colors.textSecondary}>
                    All
                  </Typography>
                </Pressable>
                {PREDEFINED_TAGS.map(tag => (
                  <Pressable
                    key={tag}
                    style={[styles.tagFilter, activeTag === tag && styles.tagFilterActive]}
                    onPress={() => setActiveTag(prev => prev === tag ? null : tag)}
                  >
                    <Typography preset="caption" color={activeTag === tag ? colors.textOnPrimary : colors.textSecondary}>
                      {tag}
                    </Typography>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </>
      )}

      {viewMode === 'bookmarked' ? (
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
              <View style={styles.loadingWrap}><ActivityIndicator color={colors.primary} /></View>
            )
          }
          renderItem={renderBookmark}
        />
      ) : (
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
              <View style={styles.loadingWrap}><ActivityIndicator color={colors.primary} /></View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}><ActivityIndicator color={colors.primary} size="small" /></View>
            ) : null
          }
          renderItem={renderSession}
        />
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
          style={styles.renameInput}
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
          style={{ marginTop: spacing[3] }}
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
                style={[styles.tagOption, active && styles.tagOptionActive]}
                onPress={() => handleToggleTag(tag)}
              >
                <Typography preset="bodySm" color={active ? colors.textOnPrimary : colors.textPrimary}>
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
          style={{ marginTop: spacing[4] }}
        />
      </AppModal>

      <LoadingOverlay visible={isDeleting || isClearingHistory} />
      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  fill: { flex: 1 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[1], paddingVertical: spacing[3],
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  modeTabActive: { borderBottomColor: colors.primary },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing[3],
    gap: spacing[2], backgroundColor: colors.background,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchBarContainer: { flex: 1, marginBottom: 0 },
  clearBtn: { padding: spacing[1] },

  tagBarWrapper: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  tagBar: { paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing[2], gap: spacing[2] },
  tagFilter: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: layout.pillRadius, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.backgroundSecondary,
  },
  tagFilterActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10], flexGrow: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing[20] },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },

  renameInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: layout.cardRadius,
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    fontSize: fontSizes.md, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary,
  },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  tagOption: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[2],
    borderRadius: layout.pillRadius, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.backgroundSecondary,
  },
  tagOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
