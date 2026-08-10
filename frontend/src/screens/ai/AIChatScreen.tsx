import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';

import { ChatBubble } from '../../components/domain';
import { AlbumsIcon, ArrowRightIcon, BookmarkIcon, CameraIcon, CheckCircleIcon, ClockIcon, CopyIcon, FileTextIcon, PlusIcon, RefreshIcon, ShareIcon, SparklesIcon, StarIcon, StarOutlineIcon } from '../../components/icons';
import { ActionSheet, ConfirmDialog } from '../../components/feedback';
import { Typography } from '../../components/ui';
import { ChatInput } from './components/ChatInput';
import { CardProposalSheet } from './components/CardProposalSheet';
import { useAuthStore, useAIChatStore, type ChatUIMessage } from '../../store';
import { useAIChat, useAddBookmark, useBookmarks, useBulkCreateCards, useConfirmDialog, useCreditBalance, useMarkCardsSaved, useMediaFiles, usePickMedia, useRemoveBookmark, useUpdateSessionTags } from '../../hooks';
import { detectTags } from '../../utils/tagDetector';
import { storage } from '../../utils/storage';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme, type Theme } from '../../theme';
import type { AIScreenProps } from '../../navigation/types';
import type { ChatMessage, MediaFile, MediaFileType, SuggestedCard } from '../../types';

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
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const user = useAuthStore(s => s.user);

  const autoSend = route.params?.autoSend;

  // Active conversation lives in the store, so it survives navigation. The chat
  // shown is always what's here until cleared or a history session is loaded.
  const messages = useAIChatStore(s => s.messages);
  const setMessages = useAIChatStore(s => s.setMessages);
  const sessionId = useAIChatStore(s => s.sessionId);
  const tags = useAIChatStore(s => s.tags);
  const setTags = useAIChatStore(s => s.setTags);
  const savedMessageIds = useAIChatStore(s => s.savedMessageIds);
  const markSaved = useAIChatStore(s => s.markSaved);
  const unmarkSaved = useAIChatStore(s => s.unmarkSaved);
  const clearChat = useAIChatStore(s => s.clear);

  const listRef = useRef<FlatList>(null);
  const lastAutoSendRef = useRef<string | undefined>(undefined);
  const { show, dialogProps } = useConfirmDialog();

  const [saveModal, setSaveModal] = useState<{
    visible: boolean;
    cards: SuggestedCard[];
    messageId: string;
    chatId?: string;
  }>({ visible: false, cards: [], messageId: '' });

  // ActionSheet state for long-press on messages
  const [sheet, setSheet] = useState<{ visible: boolean; message: ChatUIMessage | null }>({
    visible: false,
    message: null,
  });

  // Phase F: PDF (F.1) or image (F.2) attached — from My Media or straight from the device.
  const [attachment, setAttachment] = useState<{ id: string; name: string; type: MediaFileType; localUri?: string } | null>(null);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false); // source chooser
  const [pickerVisible, setPickerVisible] = useState(false);         // My Media list
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [policyDialogVisible, setPolicyDialogVisible] = useState(false);
  const { data: media = [] } = useMediaFiles();
  const { pickImage, takePhoto, pickPdf, isUploading, pendingLocalUri } = usePickMedia();

  const { mutate: sendMessage, isPending } = useAIChat();
  const { mutateAsync: bulkCreateCards } = useBulkCreateCards();
  const { mutate: markCardsSaved } = useMarkCardsSaved();
  const { mutate: updateTags } = useUpdateSessionTags();
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

  useEffect(() => {
    storage.getAiPolicyAccepted().then(accepted => setPolicyAccepted(accepted));
  }, []);

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

      // Snapshot + clear the attachment now so it's sent once and the composer resets.
      const att = attachment;
      setAttachment(null);

      const userMsgId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', text: question, timestamp: Date.now(), creditsUsed: att ? (att.type === 'PDF' ? 5 : 3) : 1, attachmentName: att?.name, attachmentType: att?.type, attachmentLocalUri: att?.localUri },
        { id: `${userMsgId}_typing`, role: 'ai', text: TYPING_INDICATOR, timestamp: Date.now() },
      ]);

      sendMessage(
        { question, history, sessionId, mediaIds: att ? [att.id] : undefined },
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
            Toast.show({
              type: 'error',
              text1: 'Could not get response',
              text2: getErrorMessage(err),
            });
          },
        },
      );
    },
    [creditBalance, isBalanceLoading, messages, sendMessage, updateTags, sessionId, tags, setTags, setMessages, attachment],
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
            Toast.show({
              type: 'error',
              text1: 'Could not regenerate response',
              text2: getErrorMessage(err),
            });
          },
        },
      );
    },
    [messages, sendMessage, sessionId, unmarkSaved, setMessages],
  );

  const handleLongPress = useCallback((item: ChatUIMessage) => {
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
      onConfirm: () => clearChat(),
    });
  };

  const handleSaveCards = useCallback(async (setId: string) => {
    try {
      await bulkCreateCards({ setId, cards: saveModal.cards });
      Toast.show({ type: 'success', text1: `${saveModal.cards.length} card${saveModal.cards.length !== 1 ? 's' : ''} saved!` });
      markSaved(saveModal.messageId);
      // Persist saved-state so the "Saved" chip survives reopening from history.
      if (saveModal.chatId) markCardsSaved(saveModal.chatId);
      setSaveModal({ visible: false, cards: [], messageId: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to save cards', text2: getErrorMessage(e) });
      throw e;
    }
  }, [bulkCreateCards, saveModal, markCardsSaved, markSaved]);

  // Attach flow (Phase F). Media is credit-metered (min image cost 3); if the user can't
  // afford it, the source menu becomes an Upgrade nudge instead of a picker.
  const MIN_MEDIA_COST = 3;
  const goPaywall = () => navigation.navigate('ProfileTab', { screen: 'Paywall' });

  const attachFromDevice = async (pick: () => Promise<(MediaFile & { localUri?: string }) | null>) => {
    const file = await pick();
    if (file) setAttachment({ id: file.id, name: file.name, type: file.type, localUri: file.localUri });
  };

  const attachMenuActions = creditBalance < MIN_MEDIA_COST
    ? [
        { label: 'Media costs 3–5 credits', icon: StarOutlineIcon, onPress: () => {}, disabled: true },
        { label: 'Upgrade to Premium', icon: StarIcon, onPress: goPaywall },
      ]
    : [
        { label: 'Choose from My Media', icon: AlbumsIcon, onPress: () => setPickerVisible(true) },
        { label: 'Photo Library', icon: AlbumsIcon, onPress: () => attachFromDevice(pickImage) },
        { label: 'Take Photo', icon: CameraIcon, onPress: () => attachFromDevice(takePhoto) },
        { label: 'Choose PDF', icon: FileTextIcon, onPress: () => attachFromDevice(pickPdf) },
      ];

  // My Media list — PDFs + images already uploaded.
  const pickerActions = media.length > 0
    ? media.map(f => ({
        label: f.name,
        icon: f.type === 'PDF' ? FileTextIcon : AlbumsIcon,
        onPress: () => setAttachment({ id: f.id, name: f.name, type: f.type }),
      }))
    : [{ label: 'No files in My Media', icon: FileTextIcon, onPress: () => {}, disabled: true }];

  const isCurrentMessageBookmarked = sheet.message?.chatId
    ? bookmarkedChatIds.has(sheet.message.chatId)
    : false;

  const sheetActions = sheet.message ? [
    {
      label: 'Copy',
      icon: CopyIcon,
      onPress: handleCopyMessage,
    },
    {
      label: 'Share',
      icon: ShareIcon,
      onPress: handleShareMessage,
    },
    ...(sheet.message.role === 'ai' ? [
      {
        label: 'Regenerate',
        icon: RefreshIcon,
        onPress: () => sheet.message && handleRegenerate(sheet.message),
        disabled: isPending,
      },
      {
        label: isCurrentMessageBookmarked ? 'Remove Bookmark' : 'Bookmark',
        icon: isCurrentMessageBookmarked ? StarIcon : StarOutlineIcon,
        onPress: handleToggleBookmark,
        disabled: !sheet.message.chatId,
      },
      {
        label: 'Save as Card',
        icon: BookmarkIcon,
        onPress: () => {
          if (!sheet.message) return;
          setSaveModal({
            visible: true,
            cards: [{ question: sheet.message.userQuestion ?? sheet.message.text, answer: sheet.message.text }],
            messageId: sheet.message.id,
            chatId: sheet.message.chatId,
          });
        },
      },
    ] : []),
  ] : [];

  const renderItem = useCallback(({ item }: { item: ChatUIMessage }) => (
    <View>
      {/* Attachment preview on user messages */}
      {item.role === 'user' && item.attachmentType === 'IMAGE' && item.attachmentLocalUri ? (
        <Image source={{ uri: item.attachmentLocalUri }} style={styles.msgImageThumb} resizeMode="cover" />
      ) : item.role === 'user' && item.attachmentName ? (
        <View style={styles.attachmentChip}>
          <FileTextIcon size={14} color={colors.primary} />
          <Typography preset="caption" color={colors.primary} numberOfLines={1} style={styles.attachmentChipText}>
            {item.attachmentName}
          </Typography>
        </View>
      ) : null}
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
              <ArrowRightIcon size={12} color={colors.primary} />
              <Typography preset="caption" color={colors.primary} style={styles.followUpText}>
                {q}
              </Typography>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Flashcard proposal banner — shown when AI generated cards (incl. history) */}
      {item.role === 'ai' && item.text !== TYPING_INDICATOR && item.suggestedCards && item.suggestedCards.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.cardBanner}>
          <AlbumsIcon size={16} color={colors.primary} />
          <Typography preset="bodySm" color={colors.primary} style={styles.cardBannerText}>
            {item.suggestedCards.length} flashcard{item.suggestedCards.length !== 1 ? 's' : ''} ready
          </Typography>
          {savedMessageIds.has(item.id) ? (
            <View style={styles.savedChip}>
              <CheckCircleIcon size={14} color={colors.success} />
              <Typography preset="caption" color={colors.success}> Saved</Typography>
            </View>
          ) : (
            <Pressable
              style={styles.saveToSetBtn}
              onPress={() => setSaveModal({ visible: true, cards: item.suggestedCards!, messageId: item.id, chatId: item.chatId })}
              hitSlop={8}
            >
              <Typography preset="caption" color={colors.background}>Save to Set</Typography>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  ), [user, handleLongPress, handleSend, isPending, isBalanceLoading, savedMessageIds, setSaveModal, colors, styles]);

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <SparklesIcon size={ICON_SIZE} color={colors.textOnPrimary} />
          </View>
          <View>
            <Typography preset="h4">AI Bible Assistant</Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              Powered by Claude
            </Typography>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* Always rendered to prevent layout shift — hidden via opacity when no messages */}
          <Pressable
            onPress={handleExport}
            hitSlop={8}
            disabled={!hasExportableMessages}
            style={{ opacity: hasExportableMessages ? 1 : 0 }}
          >
            <FileTextIcon size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={handleClearChat} hitSlop={8}>
            <PlusIcon
              size={ICON_SIZE}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ChatHistory')}
            hitSlop={8}
            style={({ pressed }) => [styles.historyBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ClockIcon size={ICON_SIZE} color={colors.primary} />
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
        extraData={savedMessageIds}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <SparklesIcon size={EMPTY_ICON_SIZE} color={colors.primaryLight} />
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
        attachmentName={attachment?.name ?? null}
        attachmentType={attachment?.type ?? (pendingLocalUri ? 'IMAGE' : 'PDF')}
        attachmentLocalUri={pendingLocalUri ?? attachment?.localUri ?? null}
        isUploading={isUploading}
        onAttachPress={() => {
          Keyboard.dismiss();
          if (policyAccepted) { setAttachMenuVisible(true); }
          else { setPolicyDialogVisible(true); }
        }}
        onClearAttachment={() => setAttachment(null)}
        onUpgrade={goPaywall}
      />

      {/* ── Attach source chooser (My Media / device) ── */}
      <ActionSheet
        visible={attachMenuVisible}
        title={isUploading ? 'Uploading…' : 'Attach a file'}
        actions={attachMenuActions}
        onClose={() => setAttachMenuVisible(false)}
      />

      {/* ── My Media list ── */}
      <ActionSheet
        visible={pickerVisible}
        title="Choose from My Media"
        actions={pickerActions}
        onClose={() => setPickerVisible(false)}
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

      {/* ── Content policy banner (one-time, before first attachment) ── */}
      <ConfirmDialog
        visible={policyDialogVisible}
        title="Content Policy"
        message={"Please keep attachments appropriate.\n\nDo not upload sexual, violent, or illegal content. Violations may result in account suspension.\n\nBy continuing, you agree to our content guidelines."}
        confirmLabel="I Agree"
        cancelLabel="Cancel"
        onConfirm={() => {
          storage.setAiPolicyAccepted();
          setPolicyAccepted(true);
          setPolicyDialogVisible(false);
          setAttachMenuVisible(true);
        }}
        onCancel={() => setPolicyDialogVisible(false)}
      />
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

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
    borderRadius: layout.cardRadius,
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
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    padding: spacing[3],
  },

  msgImageThumb: {
    width: 200,
    height: 150,
    borderRadius: layout.cardRadius,
    alignSelf: 'flex-end',
    marginRight: spacing[4],
    marginBottom: spacing[1],
  },

  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    alignSelf: 'flex-end',
    maxWidth: '80%',
    marginRight: spacing[4],
    marginBottom: spacing[1],
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  attachmentChipText: { flexShrink: 1 },

  followUps: {
    paddingLeft: spacing[10],
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
    borderRadius: layout.pillRadius,
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
    marginLeft: spacing[10],
    marginRight: spacing[4],
    marginBottom: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.primarySurface,
    borderRadius: spacing[2.5],
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  cardBannerText: { flex: 1 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  saveToSetBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing[2],
    paddingVertical: spacing[1.5],
    paddingHorizontal: spacing[3],
  },
});
