import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import Clipboard from '@react-native-clipboard/clipboard';

import { ChatBubble, CreditBadge } from '../../components/domain';
import { ActionSheet, ConfirmDialog } from '../../components/feedback';
import { Typography } from '../../components/ui';
import { ChatInput } from './components/ChatInput';
import { CardProposalSheet } from './components/CardProposalSheet';
import { useAuthStore } from '../../store';
import { useAIChat, useAddBookmark, useBookmarks, useBulkCreateCards, useConfirmDialog, useCreditBalance, useRemoveBookmark } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { AIScreenProps } from '../../navigation/types';
import type { ChatMessage, SuggestedCard } from '../../types';

const ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 48;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Message {
  id: string;
  chatId?: string;       // actual AIChat.id from DB (AI messages only)
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  creditsUsed?: number;
  followUps?: string[];       // AI-generated follow-up chips
  suggestedCards?: SuggestedCard[]; // AI-generated flashcard proposals
}

const TYPING_INDICATOR = '__typing__' as const;

const SUGGESTIONS = [
  'What does the Gospel of John teach about eternal life?',
  'Explain the Sermon on the Mount',
  'What is the significance of the Psalms?',
  'Who were the twelve apostles?',
];

export function AIChatScreen({ navigation, route }: AIScreenProps<'AIChat'>) {
  const user = useAuthStore(s => s.user);

  // When navigated from Chat History, pre-populate with the existing session.
  const existingSession = route.params?.session;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (!existingSession) return [];
    // Each AIChat record is one Q&A pair — expand into two Message objects.
    return existingSession.messages.flatMap(chat => [
      {
        id: `${chat.id}_user`,
        role: 'user' as const,
        text: chat.question,
        timestamp: new Date(chat.createdAt).getTime(),
        creditsUsed: 1,
      },
      {
        id: `${chat.id}_ai`,
        chatId: chat.id,
        role: 'ai' as const,
        text: chat.answer,
        timestamp: new Date(chat.createdAt).getTime(),
      },
    ]);
  });

  const listRef = useRef<FlatList>(null);
  // Reuse the existing sessionId so new messages join the same conversation.
  // Falls back to a fresh UUID for standalone (null sessionId) chats.
  const sessionIdRef = useRef<string>(
    existingSession?.sessionId ?? generateUUID()
  );
  const { show, dialogProps } = useConfirmDialog();

  const [saveModal, setSaveModal] = useState<{
    visible: boolean;
    cards: SuggestedCard[];
    messageId: string;
  }>({ visible: false, cards: [], messageId: '' });
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

  // ActionSheet state for long-press on messages
  const [sheet, setSheet] = useState<{ visible: boolean; message: Message | null }>({
    visible: false,
    message: null,
  });

  const { mutate: sendMessage, isPending } = useAIChat();
  const { mutateAsync: bulkCreateCards } = useBulkCreateCards();
  const { data: creditData, isLoading: isBalanceLoading } = useCreditBalance();
  // Only fetch bookmarks once the user has received at least one AI response
  // (which gives it a real chatId worth bookmarking)
  const hasBookmarkableMessages = messages.some(m => m.role === 'ai' && !!m.chatId);
  const { data: bookmarksData } = useBookmarks(hasBookmarkableMessages);
  const { mutate: addBookmark } = useAddBookmark();
  const { mutate: removeBookmark } = useRemoveBookmark();

  const creditBalance = (creditData?.balance ?? 0) - (isPending ? 1 : 0);
  const bookmarkedChatIds = new Set(bookmarksData?.bookmarks.map(b => b.id) ?? []);
  const hasExportableMessages = messages.some(m => m.text !== TYPING_INDICATOR);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSend = useCallback(
    (question: string) => {
      if (isBalanceLoading) return;

      if (creditBalance <= 0) {
        Toast.show({
          type: 'error',
          text1: 'No credits',
          text2: 'Claim your daily credit from the Home screen.',
        });
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

      const userMsgId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', text: question, timestamp: Date.now(), creditsUsed: 1 },
        { id: `${userMsgId}_typing`, role: 'ai', text: TYPING_INDICATOR, timestamp: Date.now() },
      ]);

      sendMessage(
        { question, history, sessionId: sessionIdRef.current },
        {
          onSuccess: data => {
            setMessages(prev =>
              prev
                .filter(m => m.id !== `${userMsgId}_typing`)
                .concat({
                  id: `${userMsgId}_ai`,
                  chatId: data.id,
                  role: 'ai',
                  text: data.answer,
                  timestamp: new Date(data.createdAt).getTime(),
                  followUps: data.followUps,
                  suggestedCards: data.suggestedCards,
                }),
            );
          },
          onError: err => {
            setMessages(prev => prev.filter(m => m.id !== `${userMsgId}_typing`));
            Toast.show({
              type: 'error',
              text1: 'Could not get response',
              text2: getErrorMessage(err),
            });
          },
        },
      );
    },
    [creditBalance, isBalanceLoading, messages, sendMessage],
  );

  const handleRegenerate = useCallback(
    (item: Message) => {
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
        { question: userMsg.text, history, sessionId: sessionIdRef.current },
        {
          onSuccess: data => {
            setMessages(prev =>
              prev.map(m =>
                m.id === item.id
                  ? { ...m, chatId: data.id, text: data.answer, timestamp: new Date(data.createdAt).getTime(), followUps: data.followUps, suggestedCards: data.suggestedCards }
                  : m,
              ),
            );
          },
          onError: err => {
            setMessages(prev => prev.map(m => m.id === item.id ? item : m));
            Toast.show({
              type: 'error',
              text1: 'Could not regenerate response',
              text2: getErrorMessage(err),
            });
          },
        },
      );
    },
    [messages, sendMessage],
  );

  const handleLongPress = useCallback((item: Message) => {
    if (item.text === TYPING_INDICATOR) return;
    setSheet({ visible: true, message: item });
  }, []);

  const handleCopyMessage = () => {
    if (!sheet.message) return;
    Clipboard.setString(sheet.message.text);
    Toast.show({ type: 'success', text1: 'Copied to clipboard' });
  };

  const handleShareMessage = () => {
    if (!sheet.message) return;
    Share.share({ message: sheet.message.text });
  };

  const handleToggleBookmark = () => {
    const chatId = sheet.message?.chatId;
    if (!chatId) return;
    if (bookmarkedChatIds.has(chatId)) {
      removeBookmark(chatId, {
        onSuccess: () => Toast.show({ type: 'success', text1: 'Bookmark removed' }),
      });
    } else {
      addBookmark(chatId, {
        onSuccess: () => Toast.show({ type: 'success', text1: 'Bookmarked' }),
      });
    }
  };

  const handleExport = useCallback(() => {
    const exportable = messages.filter(m => m.text !== TYPING_INDICATOR);
    if (exportable.length === 0) return;
    const lines = exportable.map(m =>
      m.role === 'user' ? `You: ${m.text}` : `AI: ${m.text}`,
    ).join('\n\n');
    const header = `AI Bible Study — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const divider = '─'.repeat(36);
    Share.share({ message: `${header}\n${divider}\n\n${lines}` });
  }, [messages]);

  const handleClearChat = () => {
    if (messages.length === 0) return;
    show({
      title: 'New Conversation',
      message: 'Clear the current chat and start fresh?',
      confirmLabel: 'Clear',
      variant: 'danger',
      onConfirm: () => {
        setMessages([]);
        sessionIdRef.current = generateUUID();
      },
    });
  };

  const handleSaveCards = useCallback(async (setId: string) => {
    try {
      await bulkCreateCards({ setId, cards: saveModal.cards });
      Toast.show({ type: 'success', text1: `${saveModal.cards.length} card${saveModal.cards.length !== 1 ? 's' : ''} saved!` });
      setSavedMessageIds(prev => new Set([...prev, saveModal.messageId]));
      setSaveModal({ visible: false, cards: [], messageId: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save cards', text2: getErrorMessage(e) });
    }
  }, [bulkCreateCards, saveModal]);

  const isCurrentMessageBookmarked = sheet.message?.chatId
    ? bookmarkedChatIds.has(sheet.message.chatId)
    : false;

  const sheetActions = sheet.message ? [
    {
      label: 'Copy',
      iconName: 'copy-outline',
      onPress: handleCopyMessage,
    },
    {
      label: 'Share',
      iconName: 'share-outline',
      onPress: handleShareMessage,
    },
    ...(sheet.message.role === 'ai' ? [
      {
        label: 'Regenerate',
        iconName: 'refresh-outline',
        onPress: () => sheet.message && handleRegenerate(sheet.message),
        disabled: isPending,
      },
      {
        label: isCurrentMessageBookmarked ? 'Remove Bookmark' : 'Bookmark',
        iconName: isCurrentMessageBookmarked ? 'star' : 'star-outline',
        onPress: handleToggleBookmark,
        disabled: !sheet.message.chatId,
      },
    ] : []),
  ] : [];

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <View>
      <Pressable onLongPress={() => handleLongPress(item)}>
        <ChatBubble
          role={item.role}
          text={item.text}
          creditsUsed={item.creditsUsed}
          userName={user?.name}
          userImage={user?.profileImage}
          isTyping={item.text === TYPING_INDICATOR}
          timestamp={item.text !== TYPING_INDICATOR ? item.timestamp : undefined}
        />
      </Pressable>

      {/* Follow-up suggestion chips after AI messages */}
      {item.role === 'ai' && item.text !== TYPING_INDICATOR && item.followUps && item.followUps.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.followUps}>
          {item.followUps.map((q, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.followUpChip, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => handleSend(q)}
              disabled={isPending || isBalanceLoading}
            >
              <Icon name="arrow-forward-outline" size={12} color={colors.primary} />
              <Typography preset="caption" color={colors.primary} style={styles.followUpText}>
                {q}
              </Typography>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Flashcard proposal banner — shown when AI generated cards */}
      {item.role === 'ai' && item.text !== TYPING_INDICATOR && item.suggestedCards && item.suggestedCards.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.cardBanner}>
          <Icon name="albums-outline" size={16} color={colors.primary} />
          <Typography preset="bodySm" color={colors.primary} style={styles.cardBannerText}>
            {item.suggestedCards.length} flashcard{item.suggestedCards.length !== 1 ? 's' : ''} ready
          </Typography>
          {savedMessageIds.has(item.id) ? (
            <View style={styles.savedChip}>
              <Icon name="checkmark-circle" size={14} color={colors.success} />
              <Typography preset="caption" color={colors.success}> Saved</Typography>
            </View>
          ) : (
            <Pressable
              style={styles.saveToSetBtn}
              onPress={() => setSaveModal({ visible: true, cards: item.suggestedCards!, messageId: item.id })}
              hitSlop={8}
            >
              <Typography preset="caption" color={colors.background}>Save to Set</Typography>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  ), [user, handleLongPress, handleSend, isPending, isBalanceLoading, savedMessageIds, setSaveModal]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={ICON_SIZE} color={colors.textOnPrimary} />
          </View>
          <View>
            <Typography preset="h4">AI Bible Assistant</Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              Powered by Claude
            </Typography>
          </View>
        </View>
        <View style={styles.headerRight}>
          <CreditBadge balance={creditBalance} />
          {/* Always rendered to prevent layout shift — hidden via opacity when no messages */}
          <Pressable
            onPress={handleExport}
            hitSlop={8}
            disabled={!hasExportableMessages}
            style={{ opacity: hasExportableMessages ? 1 : 0 }}
          >
            <Icon name="document-text-outline" size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={handleClearChat} hitSlop={8}>
            <Icon
              name="trash-outline"
              size={ICON_SIZE}
              color={messages.length > 0 ? colors.textSecondary : colors.textDisabled}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ChatHistory')}
            hitSlop={8}
            style={({ pressed }) => [styles.historyBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="time-outline" size={ICON_SIZE} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* ── Messages ── */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Icon name="sparkles" size={EMPTY_ICON_SIZE} color={colors.primaryLight} />
            <Typography preset="h4" align="center">Ask anything about the Bible</Typography>
            <Typography preset="body" color={colors.textSecondary} align="center" style={styles.emptySub}>
              Theology, history, verses, devotional insights — I'm here to help.
            </Typography>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <Pressable
                  key={s}
                  style={({ pressed }) => [styles.suggestion, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => handleSend(s)}
                  disabled={isBalanceLoading}
                >
                  <Typography preset="bodySm" color={colors.primary}>{s}</Typography>
                </Pressable>
              ))}
            </View>
          </View>
        }
        renderItem={renderItem}
      />

      {/* ── Input ── */}
      <ChatInput
        onSend={handleSend}
        disabled={isPending || isBalanceLoading}
        creditBalance={isBalanceLoading ? undefined : creditBalance}
      />

      {/* ── Long-press ActionSheet ── */}
      <ActionSheet
        visible={sheet.visible}
        title={sheet.message?.role === 'user' ? 'Your message' : 'AI response'}
        actions={sheetActions}
        onClose={() => setSheet({ visible: false, message: null })}
      />

      <CardProposalSheet
        visible={saveModal.visible}
        cards={saveModal.cards}
        onSave={handleSaveCards}
        onClose={() => setSaveModal({ visible: false, cards: [], messageId: '' })}
      />

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

  list: {
    padding: layout.screenPaddingH,
    paddingTop: spacing[4],
    flexGrow: 1,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing[8],
    gap: spacing[3],
  },
  emptySub: { paddingHorizontal: spacing[4] },
  suggestions: {
    width: '100%',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  suggestion: {
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: spacing[3],
  },

  followUps: {
    paddingLeft: 40,
    paddingRight: spacing[4],
    gap: spacing[2],
    marginTop: -spacing[1],
    marginBottom: spacing[3],
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    alignSelf: 'flex-start',
  },
  followUpText: { flexShrink: 1 },

  cardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
    marginLeft: 40,
    marginRight: spacing[4],
    marginBottom: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.primarySurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  cardBannerText: { flex: 1 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  saveToSetBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
  },
});
