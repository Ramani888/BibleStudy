import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';

import { ActionSheet, ConfirmDialog } from '../../components/feedback';
import { Typography } from '../../components/ui';
import { BookmarkIcon, ClockIcon, CopyIcon, FileTextIcon, PlusIcon, RefreshIcon, ShareIcon, SparklesIcon, StarIcon, StarOutlineIcon } from '../../components/icons';
import { ChatInput } from './components/ChatInput';
import { CardProposalSheet } from './components/CardProposalSheet';
import { ChatMessageItem } from './components/ChatMessageItem';
import { useAuthStore, useAIChatStore, type ChatUIMessage } from '../../store';
import { useAIChat, useAddBookmark, useBookmarks, useBulkCreateCards, useConfirmDialog, useCreditBalance, useMarkCardsSaved, useRemoveBookmark, useUpdateSessionTags } from '../../hooks';
import { useAIChatAttachment } from '../../hooks/useAIChatAttachment';
import { detectTags } from '../../utils/tagDetector';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';
import type { AIScreenProps } from '../../navigation/types';
import type { ChatMessage, SuggestedCard } from '../../types';

const ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 48;
const TYPING_INDICATOR = '__typing__' as const;

const SUGGESTIONS = [
  'What does the Gospel of John teach about eternal life?',
  'Explain the Sermon on the Mount',
  'What is the significance of the Psalms?',
  'Who were the twelve apostles?',
];

export function AIChatScreen({ navigation, route }: AIScreenProps<'AIChat'>) {
  const { colors } = useTheme();
  const user = useAuthStore(s => s.user);

  const autoSend = route.params?.autoSend;

  // Active conversation lives in the store, so it survives navigation. The chat
  // shown is always what's here until cleared or a history session is loaded.
  const messages      = useAIChatStore(s => s.messages);
  const setMessages   = useAIChatStore(s => s.setMessages);
  const sessionId     = useAIChatStore(s => s.sessionId);
  const tags          = useAIChatStore(s => s.tags);
  const setTags       = useAIChatStore(s => s.setTags);
  const savedMessageIds = useAIChatStore(s => s.savedMessageIds);
  const markSaved     = useAIChatStore(s => s.markSaved);
  const unmarkSaved   = useAIChatStore(s => s.unmarkSaved);
  const clearChat     = useAIChatStore(s => s.clear);

  const listRef = useRef<FlatList>(null);
  const lastAutoSendRef = useRef<string | undefined>(undefined);
  const { show, dialogProps } = useConfirmDialog();

  const [saveModal, setSaveModal] = useState<{ visible: boolean; cards: SuggestedCard[]; messageId: string; chatId?: string }>({
    visible: false, cards: [], messageId: '',
  });
  const [sheet, setSheet] = useState<{ visible: boolean; message: ChatUIMessage | null }>({
    visible: false, message: null,
  });

  const { mutate: sendMessage, isPending }       = useAIChat();
  const { mutateAsync: bulkCreateCards }         = useBulkCreateCards();
  const { mutate: markCardsSaved }               = useMarkCardsSaved();
  const { mutate: updateTags }                   = useUpdateSessionTags();
  const { data: creditData, isLoading: isBalanceLoading } = useCreditBalance();
  const hasBookmarkableMessages = messages.some(m => m.role === 'ai' && !!m.chatId);
  const { data: bookmarksData } = useBookmarks(hasBookmarkableMessages);
  const { mutate: addBookmark }    = useAddBookmark();
  const { mutate: removeBookmark } = useRemoveBookmark();

  const creditBalance = (creditData?.balance ?? 0) - (isPending ? 1 : 0);
  const bookmarkedChatIds = useMemo(
    () => new Set(bookmarksData?.bookmarks.map(b => b.id) ?? []),
    [bookmarksData],
  );
  const hasExportableMessages = messages.some(m => m.text !== TYPING_INDICATOR);

  const goPaywall = useCallback(() => navigation.navigate('Paywall'), [navigation]);

  const att = useAIChatAttachment(creditBalance, goPaywall);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // ─── Core send logic ──────────────────────────────────────────────────────

  const handleSend = useCallback(
    (question: string) => {
      if (isBalanceLoading) return;

      if (creditBalance <= 0) {
        Toast.show({ type: 'error', text1: 'No credits', text2: 'Claim your daily credit from the Home screen.' });
        return;
      }

      // Build history from complete user+assistant pairs only. Orphaned user
      // messages (left over from failed API calls) are skipped.
      const settled = messages.filter(m => m.text !== TYPING_INDICATOR);
      const rawHistory: ChatMessage[] = [];
      for (let i = 0; i < settled.length; i++) {
        const msg = settled[i];
        const next = settled[i + 1];
        if (msg.role === 'user' && next?.role === 'ai') {
          rawHistory.push({ role: 'user', content: msg.text });
          rawHistory.push({ role: 'assistant', content: next.text });
          i++;
        }
      }
      const history = rawHistory.slice(-20);

      // Snapshot + clear the attachment now so it's sent once and the composer resets.
      const snap = att.attachment;
      att.setAttachment(null);

      const userMsgId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', text: question, timestamp: Date.now(), creditsUsed: snap ? (snap.type === 'PDF' ? 5 : 3) : 1, attachmentName: snap?.name, attachmentType: snap?.type, attachmentLocalUri: snap?.localUri },
        { id: `${userMsgId}_typing`, role: 'ai', text: TYPING_INDICATOR, timestamp: Date.now() },
      ]);

      sendMessage(
        { question, history, sessionId, mediaIds: snap ? [snap.id] : undefined },
        {
          onSuccess: data => {
            setMessages(prev =>
              prev
                .filter(m => m.id !== `${userMsgId}_typing`)
                // Reflect the actual charge (flashcards cost more than a text question).
                .map(m => (m.id === userMsgId ? { ...m, creditsUsed: data.creditsUsed } : m))
                .concat({
                  id: `${userMsgId}_ai`,
                  chatId: data.id,
                  role: 'ai',
                  text: data.answer,
                  timestamp: new Date(data.createdAt).getTime(),
                  followUps: data.followUps,
                  suggestedCards: data.suggestedCards,
                  userQuestion: question,
                }),
            );
            const newTags = detectTags(data.answer, tags);
            if (newTags.length > 0) {
              const merged = [...tags, ...newTags];
              setTags(merged);
              updateTags({ sessionId, tags: merged });
            }
          },
          onError: err => {
            setMessages(prev => prev.filter(m => m.id !== `${userMsgId}_typing`));
            Toast.show({ type: 'error', text1: 'Could not get response', text2: getErrorMessage(err) });
          },
        },
      );
    },
    [creditBalance, isBalanceLoading, messages, sendMessage, updateTags, sessionId, tags, setTags, setMessages, att],
  );

  useEffect(() => {
    if (!autoSend || isBalanceLoading || autoSend === lastAutoSendRef.current) return;
    lastAutoSendRef.current = autoSend;
    handleSend(autoSend);
  }, [autoSend, isBalanceLoading, handleSend]);

  const handleRegenerate = useCallback(
    (item: ChatUIMessage) => {
      const idx = messages.findIndex(m => m.id === item.id);
      if (idx < 1) return;
      const userMsg = messages[idx - 1];
      if (!userMsg || userMsg.role !== 'user') return;

      const before = messages.slice(0, idx - 1).filter(m => m.text !== TYPING_INDICATOR);
      const rawHistory: ChatMessage[] = [];
      for (let i = 0; i < before.length; i++) {
        const msg = before[i];
        const next = before[i + 1];
        if (msg.role === 'user' && next?.role === 'ai') {
          rawHistory.push({ role: 'user', content: msg.text });
          rawHistory.push({ role: 'assistant', content: next.text });
          i++;
        }
      }
      const history = rawHistory.slice(-20);

      setMessages(prev =>
        prev.map(m =>
          m.id === item.id
            ? { ...m, text: TYPING_INDICATOR, chatId: undefined, followUps: undefined, suggestedCards: undefined }
            : m,
        ),
      );

      sendMessage(
        { question: userMsg.text, history, sessionId },
        {
          onSuccess: data => {
            setMessages(prev =>
              prev.map(m =>
                m.id === item.id
                  ? { ...m, chatId: data.id, text: data.answer, timestamp: new Date(data.createdAt).getTime(), followUps: data.followUps, suggestedCards: data.suggestedCards, isHistorical: undefined }
                  : m,
              ),
            );
            unmarkSaved(item.id);
          },
          onError: err => {
            setMessages(prev => prev.map(m => m.id === item.id ? item : m));
            Toast.show({ type: 'error', text1: 'Could not regenerate response', text2: getErrorMessage(err) });
          },
        },
      );
    },
    [messages, sendMessage, sessionId, unmarkSaved, setMessages],
  );

  // ─── Sheet actions ────────────────────────────────────────────────────────

  const handleLongPress = useCallback((item: ChatUIMessage) => {
    if (item.text === TYPING_INDICATOR) return;
    setSheet({ visible: true, message: item });
  }, []);

  const handleCopyMessage = useCallback(() => {
    if (!sheet.message) return;
    Clipboard.setString(sheet.message.text);
    Toast.show({ type: 'success', text1: 'Copied to clipboard' });
  }, [sheet.message]);

  const handleShareMessage = useCallback(() => {
    if (!sheet.message) return;
    Share.share({ message: sheet.message.text });
  }, [sheet.message]);

  const handleToggleBookmark = useCallback(() => {
    const chatId = sheet.message?.chatId;
    if (!chatId) return;
    if (bookmarkedChatIds.has(chatId)) {
      removeBookmark(chatId, { onSuccess: () => Toast.show({ type: 'success', text1: 'Bookmark removed' }) });
    } else {
      addBookmark(chatId, { onSuccess: () => Toast.show({ type: 'success', text1: 'Bookmarked' }) });
    }
  }, [sheet.message, bookmarkedChatIds, removeBookmark, addBookmark]);

  const handleExport = useCallback(() => {
    const exportable = messages.filter(m => m.text !== TYPING_INDICATOR);
    if (exportable.length === 0) return;
    const lines = exportable.map(m => m.role === 'user' ? `You: ${m.text}` : `AI: ${m.text}`).join('\n\n');
    const header = `AI Bible Study — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const divider = '─'.repeat(36);
    Share.share({ message: `${header}\n${divider}\n\n${lines}` });
  }, [messages]);

  const handleClearChat = useCallback(() => {
    if (messages.length === 0) return;
    show({ title: 'New Conversation', message: 'Clear the current chat and start fresh?', confirmLabel: 'Clear', variant: 'danger', onConfirm: () => clearChat() });
  }, [messages.length, show, clearChat]);

  const handleSaveCards = useCallback(async (setId: string) => {
    try {
      await bulkCreateCards({ setId, cards: saveModal.cards });
      Toast.show({ type: 'success', text1: `${saveModal.cards.length} card${saveModal.cards.length !== 1 ? 's' : ''} saved!` });
      markSaved(saveModal.messageId);
      if (saveModal.chatId) markCardsSaved(saveModal.chatId);
      setSaveModal({ visible: false, cards: [], messageId: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save cards', text2: getErrorMessage(e) });
      throw e;
    }
  }, [bulkCreateCards, saveModal, markCardsSaved, markSaved]);

  const isCurrentMessageBookmarked = sheet.message?.chatId ? bookmarkedChatIds.has(sheet.message.chatId) : false;

  const sheetActions = useMemo(() => sheet.message ? [
    { label: 'Copy',  icon: CopyIcon,  onPress: handleCopyMessage },
    { label: 'Share', icon: ShareIcon, onPress: handleShareMessage },
    ...(sheet.message.role === 'ai' ? [
      { label: 'Regenerate', icon: RefreshIcon, onPress: () => sheet.message && handleRegenerate(sheet.message), disabled: isPending },
      { label: isCurrentMessageBookmarked ? 'Remove Bookmark' : 'Bookmark', icon: isCurrentMessageBookmarked ? StarIcon : StarOutlineIcon, onPress: handleToggleBookmark, disabled: !sheet.message.chatId },
      { label: 'Save as Card', icon: BookmarkIcon, onPress: () => {
        if (!sheet.message) return;
        setSaveModal({ visible: true, cards: [{ question: sheet.message.userQuestion ?? sheet.message.text, answer: sheet.message.text }], messageId: sheet.message.id, chatId: sheet.message.chatId });
      }},
    ] : []),
  ] : [],
  [sheet.message, handleCopyMessage, handleShareMessage, handleRegenerate, isPending,
   isCurrentMessageBookmarked, handleToggleBookmark]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: ChatUIMessage }) => (
    <ChatMessageItem
      item={item}
      userName={user?.name}
      userImage={user?.profileImage}
      isPending={isPending}
      isBalanceLoading={isBalanceLoading}
      savedMessageIds={savedMessageIds}
      colors={colors as unknown as Record<string, string>}
      onLongPress={handleLongPress}
      onSend={handleSend}
      onSaveCards={(cards, messageId, chatId) => setSaveModal({ visible: true, cards, messageId, chatId })}
    />
  ), [user, isPending, isBalanceLoading, savedMessageIds, colors, handleLongPress, handleSend]);

  return (
    <KeyboardAvoidingView style={[styles.safe, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <SafeAreaView style={styles.flex} edges={['top']}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiBadge, { backgroundColor: colors.accent }]}>
            <SparklesIcon size={ICON_SIZE} color={colors.textOnAccent} />
          </View>
          <View>
            <Typography preset="h4">AI Bible Assistant</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Powered by Claude</Typography>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={handleExport} hitSlop={8} disabled={!hasExportableMessages} style={({ pressed }) => ({ opacity: hasExportableMessages ? (pressed ? 0.7 : 1) : 0 })}>
            <FileTextIcon size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={handleClearChat} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <PlusIcon size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ChatHistory')} hitSlop={8} style={({ pressed }) => [styles.historyBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <ClockIcon size={ICON_SIZE} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        extraData={savedMessageIds}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <SparklesIcon size={EMPTY_ICON_SIZE} color={colors.accent} />
            <Typography preset="h4" align="center">Ask anything about the Bible</Typography>
            <Typography preset="body" color={colors.textSecondary} align="center" style={styles.emptySub}>
              Theology, history, verses, devotional insights — I'm here to help.
            </Typography>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <Pressable
                  key={s}
                  style={({ pressed }) => [styles.suggestion, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => handleSend(s)}
                  disabled={isBalanceLoading}
                >
                  <Typography preset="bodySm" color={colors.accent}>{s}</Typography>
                </Pressable>
              ))}
            </View>
            <Typography preset="caption" color={colors.textSecondary} align="center" style={styles.emptySub}>
              AI answers cite Bible verses but may contain errors. Verify important interpretations with your pastor or a trusted commentary.
            </Typography>
          </View>
        }
        renderItem={renderItem}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isPending || isBalanceLoading}
        creditBalance={isBalanceLoading ? undefined : creditBalance}
        attachmentName={att.attachment?.name ?? null}
        attachmentType={att.attachment?.type ?? (att.pendingLocalUri ? 'IMAGE' : 'PDF')}
        attachmentLocalUri={att.pendingLocalUri ?? att.attachment?.localUri ?? null}
        isUploading={att.isUploading}
        onAttachPress={att.handleAttachPress}
        onClearAttachment={att.handleClearAttachment}
        onUpgrade={goPaywall}
      />

      <ActionSheet visible={att.attachMenuVisible} title={att.isUploading ? 'Uploading…' : 'Attach a file'} actions={att.attachMenuActions} onClose={() => att.setAttachMenuVisible(false)} />
      <ActionSheet visible={att.pickerVisible} title="Choose from My Media" actions={att.pickerActions} onClose={() => att.setPickerVisible(false)} />
      <ActionSheet visible={sheet.visible} title={sheet.message?.role === 'user' ? 'Your message' : 'AI response'} actions={sheetActions} onClose={() => setSheet({ visible: false, message: null })} />

      <CardProposalSheet visible={saveModal.visible} cards={saveModal.cards} onSave={handleSaveCards} onClose={() => setSaveModal({ visible: false, cards: [], messageId: '' })} />

      <ConfirmDialog {...dialogProps} />

      {/* Content policy — one-time, before first attachment */}
      <ConfirmDialog
        visible={att.policyDialogVisible}
        title="Content Policy"
        message={"Please keep attachments appropriate.\n\nDo not upload sexual, violent, or illegal content. Violations may result in account suspension.\n\nBy continuing, you agree to our content guidelines."}
        confirmLabel="I Agree"
        cancelLabel="Cancel"
        onConfirm={att.acceptPolicy}
        onCancel={() => att.setPolicyDialogVisible(false)}
      />

    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  flex:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiBadge: {
    width: spacing.huge, height: spacing.huge, borderRadius: layout.cardRadius,
    alignItems: 'center', justifyContent: 'center',
  },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  list: { padding: layout.screenPaddingH, paddingTop: spacing.lg, flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.md },
  emptySub:  { paddingHorizontal: spacing.lg },
  suggestions: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },
  suggestion:  { borderRadius: layout.cardRadius, borderWidth: 1, padding: spacing.md },
});
