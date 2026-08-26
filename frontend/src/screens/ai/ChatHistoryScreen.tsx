import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { TrashIcon } from '../../components/icons';
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
import { useAIChatHistory, useBookmarks } from '../../hooks';
import { useChatHistoryActions } from '../../hooks/useChatHistoryActions';
import { useAIChatStore } from '../../store';
import { useTheme, fontSizes, layout, spacing } from '../../theme';
import type { BookmarkedChat, ChatSession } from '../../types';
import type { AIScreenProps } from '../../navigation/types';
import { BookmarkCard, SessionCard } from './components/ChatHistoryCards';
import { StarIcon } from '../../components/icons';

const PREDEFINED_TAGS = [
  'Theology', 'Old Testament', 'New Testament',
  'Prayer', 'History', 'Devotional', 'Prophecy',
] as const;

const ListSeparator = () => <Spacer size={spacing.md} />;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagFilterBar({ activeTag, onSelect, colors }: {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { t } = useTranslation('common');
  return (
    <View style={[styles.tagBarWrapper, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagBar}>
        <Pressable
          style={({ pressed }) => [styles.tagFilter, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, activeTag === null && { backgroundColor: colors.accent, borderColor: colors.accent }, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => onSelect(null)}
        >
          <Typography preset="caption" color={activeTag === null ? colors.textOnAccent : colors.textSecondary}>{t('common:filter.all', 'All')}</Typography>
        </Pressable>
        {PREDEFINED_TAGS.map(tag => (
          <Pressable
            key={tag}
            style={({ pressed }) => [styles.tagFilter, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, activeTag === tag && { backgroundColor: colors.accent, borderColor: colors.accent }, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => onSelect(activeTag === tag ? null : tag)}
          >
            <Typography preset="caption" color={activeTag === tag ? colors.textOnAccent : colors.textSecondary}>{tag}</Typography>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function RenameModal({ visible, value, isRenaming, onClose, onChange, onSave, colors }: {
  visible: boolean; value: string; isRenaming: boolean;
  onClose: () => void; onChange: (v: string) => void; onSave: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { t } = useTranslation(['ai', 'common']);
  return (
    <AppModal visible={visible} title={t('ai:history.renameTitle', 'Rename Conversation')} onClose={onClose} showHandle>
      <TextInput
        style={[styles.renameInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
        value={value}
        onChangeText={onChange}
        placeholder={t('ai:history.namePlaceholder', 'Conversation name…')}
        placeholderTextColor={colors.textSecondary}
        autoFocus
        maxLength={200}
      />
      <Button label={isRenaming ? t('common:status.saving', 'Saving…') : t('common:actions.save', 'Save')} onPress={onSave} disabled={!value.trim() || isRenaming} fullWidth style={styles.renameModalBtn} />
    </AppModal>
  );
}

function TagsModal({ visible, selected, isUpdatingTags, onClose, onToggle, onSave, colors }: {
  visible: boolean; selected: string[]; isUpdatingTags: boolean;
  onClose: () => void; onToggle: (tag: string) => void; onSave: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { t } = useTranslation(['ai', 'common']);
  return (
    <AppModal visible={visible} title={t('ai:history.editTags', 'Edit Tags')} onClose={onClose} showHandle>
      <View style={styles.tagGrid}>
        {PREDEFINED_TAGS.map(tag => {
          const active = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              style={({ pressed }) => [styles.tagOption, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }, active && { backgroundColor: colors.accent, borderColor: colors.accent }, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => onToggle(tag)}
            >
              <Typography preset="bodySm" color={active ? colors.textOnAccent : colors.textPrimary}>{tag}</Typography>
            </Pressable>
          );
        })}
      </View>
      <Button label={isUpdatingTags ? t('common:status.saving', 'Saving…') : t('common:actions.save', 'Save')} onPress={onSave} disabled={isUpdatingTags} fullWidth style={styles.tagsModalBtn} />
    </AppModal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

import { useTranslation } from 'react-i18next';

export function ChatHistoryScreen({ navigation }: AIScreenProps<'ChatHistory'>) {
  const { t } = useTranslation(['ai', 'common']);
  const { colors } = useTheme();

  const { data, isLoading, isError, isRefetching, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAIChatHistory();
  const { data: bookmarksData, isLoading: isBookmarksLoading, isRefetching: isBookmarksRefetching, refetch: refetchBookmarks } = useBookmarks();

  const [viewMode, setViewMode]     = useState<'all' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag]   = useState<string | null>(null);

  const allSessions  = useMemo(() => data?.pages.flatMap(p => p.sessions) ?? [], [data]);
  const allBookmarks = bookmarksData?.bookmarks ?? [];

  const actions = useChatHistoryActions(navigation, allSessions);

  const filteredSessions = useMemo(
    () => allSessions.filter(s => {
      const matchesSearch = searchQuery.trim() === '' || (s.customTitle || s.title).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag    = activeTag === null || s.tags?.includes(activeTag);
      return matchesSearch && matchesTag;
    }),
    [allSessions, searchQuery, activeTag],
  );

  const handleContinue = useCallback((session: ChatSession) => {
    useAIChatStore.getState().loadSession(session);
    navigation.navigate('AIChat');
  }, [navigation]);

  const handleLongPress = useCallback((session: ChatSession) => {
    if (!session.sessionId) {
      Toast.show({ type: 'info', text1: t('ai:history.cannotManage', 'Cannot manage this conversation'), text2: t('ai:history.legacyMessagesInfo', 'Legacy messages cannot be renamed or deleted.') });
      return;
    }
    actions.setSheet({ visible: true, session });
  }, [actions, t]);

  const renderSession  = useCallback(({ item }: { item: ChatSession })    => <SessionCard  session={item} onLongPress={handleLongPress} onContinue={handleContinue} />, [handleLongPress, handleContinue]);
  const renderBookmark = useCallback(({ item }: { item: BookmarkedChat }) => <BookmarkCard chat={item} />, []);

  const hasAnyTaggedSession = allSessions.some(s => s.tags?.length > 0);

  if (isError) return <ErrorState message={t('ai:history.couldNotLoadHistory', 'Could not load history.')} onRetry={refetch} />;

  return (
    <Screen header={<ScreenHeader title={t('ai:history.title')} onBack={() => navigation.goBack()} />}>

      {/* View mode toggle */}
      <View style={[styles.modeToggle, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {(['all', 'bookmarked'] as const).map(mode => (
          <Pressable
            key={mode}
            style={({ pressed }) => [styles.modeTab, viewMode === mode && { borderBottomColor: colors.accent, borderBottomWidth: 2 }, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => { setViewMode(mode); setSearchQuery(''); setActiveTag(null); }}
          >
            {mode === 'bookmarked' && <StarIcon size={14} color={viewMode === 'bookmarked' ? colors.accent : colors.textSecondary} />}
            <Typography preset="label" color={viewMode === mode ? colors.accent : colors.textSecondary}>
              {mode === 'all' ? t('ai:history.all') : t('ai:history.bookmarked')}
            </Typography>
          </Pressable>
        ))}
      </View>

      {viewMode === 'all' && (
        <>
          <View style={[styles.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <SearchBar placeholder={t('ai:history.searchPlaceholder', 'Search conversations…')} value={searchQuery} onChangeText={setSearchQuery} containerStyle={styles.searchBarContainer} />
            {allSessions.length > 0 && (
              <Pressable onPress={actions.handleClearAll} hitSlop={8} style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.85 : 1 }]}>
                <TrashIcon size={18} color={colors.alert} />
              </Pressable>
            )}
          </View>
          {hasAnyTaggedSession && <TagFilterBar activeTag={activeTag} onSelect={setActiveTag} colors={colors} />}
        </>
      )}

      {viewMode === 'bookmarked' ? (
        <FlatList
          style={styles.fill}
          data={allBookmarks}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isBookmarksRefetching} onRefresh={refetchBookmarks} tintColor={colors.accent} />}
          ItemSeparatorComponent={ListSeparator}
          ListEmptyComponent={
            !isBookmarksLoading
              ? <EmptyState title={t('ai:history.noBookmarks', 'No bookmarks yet')} subtitle={t('ai:history.noBookmarksSub', 'Long-press any AI response and tap Bookmark to save it here')} />
              : <View style={styles.loadingWrap}><ActivityIndicator color={colors.accent} /></View>
          }
          renderItem={renderBookmark}
        />
      ) : (
        <FlatList
          style={styles.fill}
          data={filteredSessions}
          keyExtractor={item => item.sessionId ?? item.messages[0]?.id ?? 'unknown'}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
          ItemSeparatorComponent={ListSeparator}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !isLoading
              ? <EmptyState title={searchQuery ? t('common:status.noResults', 'No results found') : t('ai:history.noHistory', 'No chat history yet')} subtitle={searchQuery ? t('common:status.tryDifferentSearch', 'Try a different search term') : t('ai:history.noHistorySub', 'Your conversations with the AI assistant will appear here')} />
              : <View style={styles.loadingWrap}><ActivityIndicator color={colors.accent} /></View>
          }
          ListFooterComponent={isFetchingNextPage ? <View style={styles.footerLoader}><ActivityIndicator color={colors.accent} size="small" /></View> : null}
          renderItem={renderSession}
        />
      )}

      <ActionSheet visible={actions.sheet.visible} title={t('ai:history.conversation', 'Conversation')} actions={actions.sheetActions} onClose={() => actions.setSheet({ visible: false, session: null })} />

      <RenameModal
        visible={actions.renameModal.visible}
        value={actions.renameModal.value}
        isRenaming={actions.isRenaming}
        onClose={() => actions.setRenameModal({ visible: false, session: null, value: '' })}
        onChange={v => actions.setRenameModal(prev => ({ ...prev, value: v }))}
        onSave={actions.handleSaveRename}
        colors={colors}
      />

      <TagsModal
        visible={actions.tagsModal.visible}
        selected={actions.tagsModal.selected}
        isUpdatingTags={actions.isUpdatingTags}
        onClose={() => actions.setTagsModal({ visible: false, session: null, selected: [] })}
        onToggle={actions.handleToggleTag}
        onSave={actions.handleSaveTags}
        colors={colors}
      />

      <LoadingOverlay visible={actions.isDeleting || actions.isClearingHistory} />
      <ConfirmDialog {...actions.dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  modeToggle: { flexDirection: 'row', borderBottomWidth: 1 },
  modeTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md,
    gap: spacing.sm, borderBottomWidth: 1,
  },
  searchBarContainer: { flex: 1, marginBottom: 0 },
  clearBtn: { padding: spacing.xs },
  tagBarWrapper: { borderBottomWidth: 1 },
  tagBar: { paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.sm, gap: spacing.sm },
  tagFilter: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: layout.pillRadius, borderWidth: 1 },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge, flexGrow: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.s80 },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
  renameInput: { borderWidth: 1.5, borderRadius: layout.cardRadius, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: fontSizes.md },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: layout.pillRadius, borderWidth: 1 },
  renameModalBtn: { marginTop: spacing.md },
  tagsModalBtn: { marginTop: spacing.lg },
});
