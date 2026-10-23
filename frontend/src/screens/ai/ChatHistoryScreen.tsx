import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import {
  QMBackButton, QMButton, QMConfirmDialog, QMEmpty, QMSearchField, QMSegmented, QMSheet,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { AskIcon, BookmarkIcon, InfoIcon, SearchIcon, TagIcon, TrashIcon } from '../../components/icons';
import { LoadingOverlay } from '../../components/feedback';
import { useAIChatHistory, useBookmarks, useManualRefresh } from '../../hooks';
import { useChatHistoryActions } from '../../hooks/useChatHistoryActions';
import { useAIChatStore } from '../../store';
import { loadFailed } from '../../utils/queryState';
import { useTheme, spacing, radius, textPresets } from '../../theme';
import type { BookmarkedChat, ChatSession } from '../../types';
import type { AIScreenProps } from '../../navigation/types';
import { BookmarkCard, HistorySkeleton, SessionCard, tagLabel } from './components/ChatHistoryCards';

const PREDEFINED_TAGS = [
  'Theology', 'Old Testament', 'New Testament',
  'Prayer', 'History', 'Devotional', 'Prophecy',
] as const;
const MAX_TAGS = 5;     // ai.dto UpdateSessionTags
const TAG_MAX = 50;
const TITLE_MAX = 200;
const CHIP_H = 36;
const FIELD_H = 48;
const TOUCH = 44;

type Row = { kind: 'head'; key: string; label: string } | { kind: 'session'; key: string; session: ChatSession; index: number };

function dayBucket(iso: string): 'today' | 'yesterday' | 'earlier' {
  const d = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (d >= start) return 'today';
  start.setDate(start.getDate() - 1);
  return d >= start ? 'yesterday' : 'earlier';
}

export function ChatHistoryScreen({ navigation }: AIScreenProps<'ChatHistory'>) {
  const { t } = useTranslation(['ai', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();

  const historyQuery = useAIChatHistory();
  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = historyQuery;
  const isError = loadFailed(historyQuery); // offline with nothing cached → error, not "No conversations yet"
  const bookmarksQuery = useBookmarks();
  const { data: bookmarksData, isLoading: isBookmarksLoading, refetch: refetchBookmarks } = bookmarksQuery;
  const bookmarksFailed = loadFailed(bookmarksQuery);
  const { refreshing, onRefresh } = useManualRefresh(() => Promise.all([refetch(), refetchBookmarks()]));

  const [viewMode, setViewMode] = useState<'all' | 'bookmarked'>('all');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');

  const allSessions  = useMemo(() => data?.pages.flatMap(p => p.sessions) ?? [], [data]);
  const allBookmarks = bookmarksData?.bookmarks ?? [];

  const actions = useChatHistoryActions(navigation, allSessions);

  // Filter chips: the built-in topics plus any custom ones already in use.
  const topicNames = useMemo(() => {
    const extra = new Set<string>();
    allSessions.forEach(s => s.tags?.forEach(tag => { if (!(PREDEFINED_TAGS as readonly string[]).includes(tag)) extra.add(tag); }));
    return [...PREDEFINED_TAGS, ...extra];
  }, [allSessions]);

  const q = search.trim().toLowerCase();
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let last = '';
    let i = 0;
    allSessions
      .filter(s => (!q || (s.customTitle || s.title).toLowerCase().includes(q)) && (!activeTag || s.tags?.includes(activeTag)))
      .forEach(s => {
        const b = dayBucket(s.startedAt);
        if (b !== last) {
          last = b;
          out.push({ kind: 'head', key: `h-${b}`, label: t(`ai:qm.history.${b}`, { defaultValue: b }) });
        }
        out.push({ kind: 'session', key: s.sessionId ?? s.messages[0]?.id ?? `s-${i}`, session: s, index: i++ });
      });
    return out;
  }, [allSessions, q, activeTag, t]);

  const handleContinue = useCallback((session: ChatSession) => {
    useAIChatStore.getState().loadSession(session);
    navigation.navigate('AIChat');
  }, [navigation]);

  const handleMore = useCallback((session: ChatSession) => {
    if (!session.sessionId) {
      Toast.show({ type: 'info', text1: t('ai:qm.history.legacy', 'This older chat can’t be changed') });
      return;
    }
    actions.setSheet({ visible: true, session });
  }, [actions, t]);

  const renderRow = useCallback(({ item }: { item: Row }) => item.kind === 'head'
    ? <Typography preset="qmLabel" color={qm.muted} style={styles.group}>{item.label.toUpperCase()}</Typography>
    : <SessionCard session={item.session} index={item.index} onMore={handleMore} onContinue={handleContinue} />,
  [qm, handleMore, handleContinue]);
  const renderBookmark = useCallback(({ item, index }: { item: BookmarkedChat; index: number }) => <BookmarkCard chat={item} index={index} />, []);

  // ─── Topics sheet helpers ──────────────────────────────────────────────────
  const selected = actions.tagsModal.selected;
  const sheetTopics = useMemo(() => [...new Set([...topicNames, ...selected])], [topicNames, selected]);
  const addTopic = () => {
    const name = newTopic.trim();
    if (!name || selected.length >= MAX_TAGS) return;
    if (!selected.includes(name)) actions.handleToggleTag(name);
    setNewTopic('');
  };

  const isAll = viewMode === 'all';

  const header = (
    <View>
      <View style={styles.topRow}>
        <QMBackButton onPress={() => navigation.goBack()} label={t('common:actions.back', 'Back')} />
        <View style={styles.flex} />
        {isAll && allSessions.length > 0 && (
          <Pressable onPress={actions.handleClearAll} style={({ pressed }) => [styles.icon, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('ai:history.clearAll', 'Clear all history')}>
            <TrashIcon size={20} color={qm.muted} />
          </Pressable>
        )}
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.title} accessibilityRole="header">{t('ai:qm.history.title', 'Past conversations')}</Typography>
      <QMSegmented
        label={t('ai:qm.history.title', 'Past conversations')}
        value={viewMode}
        onChange={m => { setViewMode(m); setSearch(''); setActiveTag(null); }}
        options={[{ key: 'all', label: t('ai:history.all', 'All') }, { key: 'bookmarked', label: t('ai:history.bookmarked', 'Bookmarked') }]}
      />
      {isAll && !isLoading && !isError && allSessions.length > 0 && (
        <>
          <View style={styles.search}>
            <QMSearchField value={search} onChangeText={setSearch} placeholder={t('ai:qm.history.search', 'Search conversations')} />
          </View>
          {/* No height on the horizontal ScrollView — the wrapping View sizes it. */}
          <View style={styles.chipsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[null, ...topicNames].map(tag => {
                const on = activeTag === tag;
                return (
                  <AnimatedPressable
                    key={tag ?? 'all'}
                    scaleTo={0.95}
                    onPress={() => setActiveTag(on ? null : tag)}
                    style={[styles.chip, { backgroundColor: on ? qm.violet : qm.field }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Typography preset="qmLink" color={on ? qm.onViolet : qm.body}>{tag ? tagLabel(tag, t) : t('ai:history.all', 'All')}</Typography>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );

  let allEmpty: React.ReactElement | null = null;
  if (isLoading) allEmpty = <HistorySkeleton />;
  else if (isError) {
    allEmpty = (
      <QMEmpty
        style={styles.empty}
        icon={InfoIcon}
        title={t('ai:qm.history.errorTitle', 'Couldn’t load your conversations')}
        text={t('ai:qm.history.errorText', 'Check your connection and try again. Nothing was lost.')}
        action={{ label: t('ai:qm.chat.tryAgain', 'Try again'), onPress: () => refetch() }}
      />
    );
  } else if (allSessions.length === 0) {
    allEmpty = <QMEmpty style={styles.empty} icon={AskIcon} title={t('ai:qm.history.emptyTitle', 'No conversations yet')} text={t('ai:qm.history.emptyText', 'Ask a question and it will be saved here, so you can pick it up later.')} />;
  } else if (q) {
    allEmpty = (
      <QMEmpty
        style={styles.empty}
        icon={SearchIcon}
        title={t('ai:qm.history.noMatch', 'No conversations match')}
        // With a topic on, the word may well exist — just not under that topic.
        text={activeTag
          ? t('ai:qm.history.noTopicText', 'Try another topic, or tap All.')
          : t('ai:qm.history.noMatchText', { query: search.trim(), defaultValue: `Nothing called “${search.trim()}”. Try a different word.` })}
        action={{ label: t('quiz:qm.clearSearch', 'Clear search'), onPress: () => { setSearch(''); setActiveTag(null); } }}
      />
    );
  } else {
    allEmpty = <QMEmpty style={styles.empty} icon={TagIcon} title={t('ai:qm.history.noTopicTitle', 'Nothing with this topic')} text={t('ai:qm.history.noTopicText', 'Try another topic, or tap All.')} />;
  }

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />;
  const contentStyle = [styles.content, { paddingTop: insets.top + spacing.xs }];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      {isAll ? (
        <FlatList
          data={isLoading || isError ? [] : rows}
          keyExtractor={r => r.key}
          renderItem={renderRow}
          ListHeaderComponent={header}
          ListEmptyComponent={allEmpty}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refresh}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? (
            <View style={styles.moreRow} accessibilityRole="progressbar">
              <ActivityIndicator size="small" color={qm.muted} />
              <Typography preset="qmBody" color={qm.muted}>{t('ai:qm.history.loadingMore', 'Loading more…')}</Typography>
            </View>
          ) : null}
        />
      ) : (
        <FlatList
          data={allBookmarks}
          keyExtractor={b => b.id}
          renderItem={renderBookmark}
          ListHeaderComponent={<View style={styles.markHead}>{header}</View>}
          ListEmptyComponent={isBookmarksLoading
            ? <ActivityIndicator color={qm.violet} style={styles.loading} />
            : bookmarksFailed
            ? (
              <QMEmpty
                style={styles.empty}
                icon={InfoIcon}
                title={t('ai:qm.history.errorTitle', 'Couldn’t load your conversations')}
                text={t('ai:qm.history.errorText', 'Check your connection and try again. Nothing was lost.')}
                action={{ label: t('ai:qm.chat.tryAgain', 'Try again'), onPress: () => refetchBookmarks() }}
              />
            )
            : <QMEmpty style={styles.empty} icon={BookmarkIcon} title={t('ai:history.noBookmarks', 'No bookmarks yet')} text={t('ai:qm.history.noBookmarksText', 'Tap ··· on any answer and choose Bookmark to keep it here.')} />}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={refresh}
        />
      )}

      <QMSheet
        visible={actions.sheet.visible}
        onClose={() => actions.setSheet({ visible: false, session: null })}
        title={actions.sheet.session ? actions.sheet.session.customTitle || actions.sheet.session.title : undefined}
        actions={actions.sheetActions}
      />

      <QMSheet
        visible={actions.renameModal.visible}
        onClose={() => actions.setRenameModal({ visible: false, session: null, value: '' })}
        title={t('common:actions.rename', 'Rename')}
        sub={t('ai:qm.history.renameSub', 'A short name helps you find it later.')}
      >
        <View style={styles.form}>
          <BottomSheetTextInput
            value={actions.renameModal.value}
            onChangeText={v => actions.setRenameModal(prev => ({ ...prev, value: v }))}
            onSubmitEditing={actions.handleSaveRename}
            maxLength={TITLE_MAX}
            autoFocus
            returnKeyType="done"
            placeholder={t('ai:history.namePlaceholder', 'Conversation name…')}
            placeholderTextColor={qm.muted}
            accessibilityLabel={t('ai:history.namePlaceholder', 'Conversation name…')}
            style={[styles.field, { backgroundColor: qm.field, color: qm.ink }]}
          />
          <QMButton
            label={t('common:actions.save', 'Save')}
            onPress={actions.handleSaveRename}
            loading={actions.isRenaming}
            off={!actions.renameModal.value.trim()}
            style={styles.formBtn}
          />
        </View>
      </QMSheet>

      <QMSheet
        visible={actions.tagsModal.visible}
        onClose={() => { setNewTopic(''); actions.setTagsModal({ visible: false, session: null, selected: [] }); }}
        title={t('ai:qm.history.editTopics', 'Edit topics')}
        sub={t('ai:qm.history.topicsSub', { max: MAX_TAGS, defaultValue: `Tap to add or remove, up to ${MAX_TAGS}. Topics help you filter later.` })}
      >
        <View style={styles.form}>
          <View style={styles.topicGrid}>
            {sheetTopics.map(tag => {
              const on = selected.includes(tag);
              const full = !on && selected.length >= MAX_TAGS;
              return (
                <AnimatedPressable
                  key={tag}
                  scaleTo={0.95}
                  disabled={full}
                  onPress={() => actions.handleToggleTag(tag)}
                  style={[styles.topic, { backgroundColor: on ? qm.violet : qm.field }, full && styles.dim]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: full }}
                >
                  <Typography preset="qmLink" color={on ? qm.onViolet : qm.body}>{tagLabel(tag, t)}</Typography>
                </AnimatedPressable>
              );
            })}
          </View>
          <View style={styles.addRow}>
            <BottomSheetTextInput
              value={newTopic}
              onChangeText={setNewTopic}
              onSubmitEditing={addTopic}
              maxLength={TAG_MAX}
              returnKeyType="done"
              placeholder={t('ai:qm.history.addTopic', 'Add a topic')}
              placeholderTextColor={qm.muted}
              accessibilityLabel={t('ai:qm.history.addTopic', 'Add a topic')}
              style={[styles.field, styles.flex, { backgroundColor: qm.field, color: qm.ink }]}
            />
            <AnimatedPressable
              scaleTo={0.95}
              onPress={addTopic}
              disabled={!newTopic.trim() || selected.length >= MAX_TAGS}
              style={[styles.addBtn, { backgroundColor: newTopic.trim() && selected.length < MAX_TAGS ? qm.violet : qm.field }]}
              accessibilityRole="button"
            >
              <Typography preset="qmSegment" color={newTopic.trim() && selected.length < MAX_TAGS ? qm.onViolet : qm.muted}>{t('ai:qm.history.add', 'Add')}</Typography>
            </AnimatedPressable>
          </View>
          <QMButton label={t('common:actions.save', 'Save')} onPress={actions.handleSaveTags} loading={actions.isUpdatingTags} style={styles.formBtn} />
        </View>
      </QMSheet>

      <LoadingOverlay visible={actions.isDeleting || actions.isClearingHistory} />
      <QMConfirmDialog {...actions.dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.5 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', marginLeft: -spacing.s10 },
  icon: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: spacing.s6, marginBottom: spacing.s14 },
  search: { marginTop: spacing.md },
  chipsWrap: { marginTop: spacing.md, marginHorizontal: -spacing.xl },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  chip: { height: CHIP_H, paddingHorizontal: spacing.s14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  group: { marginTop: spacing.s22 },
  markHead: { marginBottom: spacing.lg },
  sep: { height: spacing.s10 },
  empty: { marginTop: spacing.s48 },
  loading: { marginTop: spacing.s48 },
  moreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s10, paddingTop: spacing.s18, paddingBottom: spacing.xs },
  form: { paddingHorizontal: spacing.md, paddingTop: spacing.s6 },
  field: { height: FIELD_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, ...textPresets.qmInput, fontSize: textPresets.qmBodyMd.fontSize },
  formBtn: { marginTop: spacing.lg },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  topic: { height: CHIP_H + 2, paddingHorizontal: spacing.s14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.s14 },
  addBtn: { height: FIELD_H, paddingHorizontal: spacing.lg, borderRadius: radius.r12 + 2, alignItems: 'center', justifyContent: 'center' },
});
