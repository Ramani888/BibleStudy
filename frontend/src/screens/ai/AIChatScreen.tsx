import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import { QMButton, QMConfirmDialog, QMSheet, type QMSheetAction } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  BookIcon, BookmarkIcon, CardsIcon, ClockIcon, CopyIcon, DocIcon, InfoIcon, MoreHorizontalIcon, PlusIcon, RefreshIcon, ShareUpIcon, SparklesIcon,
  type IconComponent,
} from '../../components/icons';
import { ChatInput } from './components/ChatInput';
import { CardProposalSheet } from './components/CardProposalSheet';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SparkMark } from './components/SparkMark';
import { FAILED, TYPING, isPlaceholder } from './chatMarks';
import { useAIChatStore, type ChatUIMessage } from '../../store';
import { useAIChat, useAddBookmark, useBookmarks, useBulkCreateCards, useCreditBalance, useMarkCardsSaved, useRemoveBookmark, useUpdateSessionTags } from '../../hooks';
import { useAIChatAttachment } from '../../hooks/useAIChatAttachment';
import { detectTags } from '../../utils/tagDetector';
import { formatBytes, truncate } from '../../utils/formatters';
import { getErrorMessage } from '../../api';
import { storage } from '../../utils/storage';
import { useTheme, spacing, radius } from '../../theme';
import type { AIScreenProps } from '../../navigation/types';
import type { ChatMessage, MediaFileType, SuggestedCard } from '../../types';

const TOUCH = 44;
const STARTER_TILE = 30;
const MIN_MEDIA_COST = 3;
const NO_MEDIA_TILE = 56;
const CARD_Q_MAX = 300;
const CARD_A_MAX = 1000;

type Media = { id: string; name: string; type: MediaFileType; localUri?: string };
type Sheet = 'menu' | 'message' | null;

/** Complete user→AI pairs only (orphaned or failed questions are skipped), last 20 turns. */
function buildHistory(list: ChatUIMessage[]): ChatMessage[] {
  const settled = list.filter(m => !isPlaceholder(m.text));
  const out: ChatMessage[] = [];
  for (let i = 0; i < settled.length; i++) {
    const msg = settled[i];
    const next = settled[i + 1];
    if (msg.role === 'user' && next?.role === 'ai') {
      out.push({ role: 'user', content: msg.text }, { role: 'assistant', content: next.text });
      i++;
    }
  }
  return out.slice(-20);
}

export function AIChatScreen({ navigation, route }: AIScreenProps<'AIChat'>) {
  const { t, i18n } = useTranslation(['ai', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();

  const autoSend = route.params?.autoSend;

  // Active conversation lives in the store, so it survives navigation. The chat
  // shown is always what's here until cleared or a history session is loaded.
  const messages        = useAIChatStore(s => s.messages);
  const setMessages     = useAIChatStore(s => s.setMessages);
  const sessionId       = useAIChatStore(s => s.sessionId);
  const tags            = useAIChatStore(s => s.tags);
  const setTags         = useAIChatStore(s => s.setTags);
  const savedMessageIds = useAIChatStore(s => s.savedMessageIds);
  const markSaved       = useAIChatStore(s => s.markSaved);
  const unmarkSaved     = useAIChatStore(s => s.unmarkSaved);
  const clearChat       = useAIChatStore(s => s.clear);

  // AI helper switched off in Settings → back through consent before anything is sent.
  useFocusEffect(useCallback(() => {
    storage.getAiPolicyAccepted().then(ok => { if (!ok) navigation.replace('AIConsent'); }).catch(() => {});
  }, [navigation]));

  const listRef = useRef<FlatList>(null);
  const lastAutoSendRef = useRef<string | undefined>(undefined);

  const [saveModal, setSaveModal] = useState<{ visible: boolean; cards: SuggestedCard[]; messageId: string; chatId?: string }>({
    visible: false, cards: [], messageId: '',
  });
  const [sheet, setSheet] = useState<Sheet>(null);
  const [target, setTarget] = useState<ChatUIMessage | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  // Set names cards were saved to this visit (store only keeps the "saved" flag).
  const [savedTo, setSavedTo] = useState<Record<string, string>>({});

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
  const hasExportableMessages = messages.some(m => !isPlaceholder(m.text));

  const goPaywall = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Paywall', params: { from: 'AITab' }, initial: false }), [navigation]);
  const goCredits = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Credits' }), [navigation]);
  const goMedia   = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Media' }), [navigation]);

  const att = useAIChatAttachment(creditBalance, goPaywall);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // ─── Core send logic ──────────────────────────────────────────────────────

  const send = useCallback(
    (question: string, media: Media | null) => {
      if (isBalanceLoading) return;

      // Unknown balance (offline / failed load) → let the server decide; a 402 is handled below.
      if (creditData && creditBalance <= 0) {
        Toast.show({ type: 'error', text1: t('ai:chat.noCredits', 'No credits'), text2: t('ai:chat.noCreditsSub', 'Claim your daily credit from the Home screen.') });
        return;
      }

      const history = buildHistory(messages);
      const userMsgId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        {
          id: userMsgId, role: 'user', text: question, timestamp: Date.now(), creditsUsed: media ? (media.type === 'PDF' ? 5 : 3) : 1,
          attachmentId: media?.id, attachmentName: media?.name, attachmentType: media?.type, attachmentLocalUri: media?.localUri,
        },
        { id: `${userMsgId}_typing`, role: 'ai', text: TYPING, timestamp: Date.now() },
      ]);

      sendMessage(
        { question, history, sessionId, mediaIds: media ? [media.id] : undefined },
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
            // Out of credits / over quota (402) → surface an upgrade prompt in context.
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 402) {
              // Nothing was sent or charged — drop the question too, so it isn't left unanswered.
              setMessages(prev => prev.filter(m => m.id !== `${userMsgId}_typing` && m.id !== userMsgId));
              Toast.show({ type: 'error', text1: t('ai:chat.outOfCredits', 'Out of credits'), text2: t('ai:chat.upgradeToKeepGoing', 'Upgrade to keep using AI chat.') });
              goPaywall();
              return;
            }
            // Leave the question in place with an inline "Try again" card. No response
            // at all = offline → the card's own "check your connection" line.
            const errorText = (err as { response?: unknown })?.response ? getErrorMessage(err) : undefined;
            setMessages(prev => prev.map(m => m.id === `${userMsgId}_typing` ? { ...m, text: FAILED, errorText } : m));
          },
        },
      );
    },
    [creditData, creditBalance, isBalanceLoading, messages, sendMessage, updateTags, sessionId, tags, setTags, setMessages, goPaywall, t],
  );

  const handleSend = useCallback((question: string) => {
    // Snapshot + clear the attachment now so it's sent once and the composer resets.
    const snap = att.attachment;
    att.setAttachment(null);
    send(question, snap);
  }, [att, send]);

  const handleRetry = useCallback((failed: ChatUIMessage) => {
    const idx = messages.findIndex(m => m.id === failed.id);
    const userMsg = messages[idx - 1];
    if (idx < 1 || userMsg?.role !== 'user') return;
    setMessages(prev => prev.filter(m => m.id !== failed.id && m.id !== userMsg.id));
    const media = userMsg.attachmentId && userMsg.attachmentName && userMsg.attachmentType
      ? { id: userMsg.attachmentId, name: userMsg.attachmentName, type: userMsg.attachmentType, localUri: userMsg.attachmentLocalUri }
      : null;
    send(userMsg.text, media);
  }, [messages, setMessages, send]);

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

      const history = buildHistory(messages.slice(0, idx - 1));

      setMessages(prev =>
        prev.map(m =>
          m.id === item.id
            ? { ...m, text: TYPING, chatId: undefined, followUps: undefined, suggestedCards: undefined }
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
            Toast.show({ type: 'error', text1: t('ai:chat.couldNotRegenerate', 'Could not regenerate response'), text2: getErrorMessage(err) });
          },
        },
      );
    },
    [messages, sendMessage, sessionId, unmarkSaved, setMessages, t],
  );

  // ─── Sheet actions ────────────────────────────────────────────────────────

  const handleMore = useCallback((item: ChatUIMessage) => {
    if (isPlaceholder(item.text)) return;
    setTarget(item);
    setSheet('message');
  }, []);

  const handleExport = useCallback(() => {
    const exportable = messages.filter(m => !isPlaceholder(m.text));
    if (exportable.length === 0) return;
    const youLabel = t('ai:export.you', 'You');
    const aiLabel = t('ai:export.ai', 'AI');
    const lines = exportable.map(m => m.role === 'user' ? `${youLabel}: ${m.text}` : `${aiLabel}: ${m.text}`).join('\n\n');
    const date = new Date().toLocaleDateString(i18n.language || 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const header = t('ai:export.header', { date, defaultValue: `AI Bible Study — ${date}` });
    const divider = '─'.repeat(36);
    Share.share({ message: `${header}\n${divider}\n\n${lines}` });
  }, [messages, t, i18n]);

  const handleNewChat = useCallback(() => {
    if (messages.length === 0 && !att.attachment) return;
    setNewChatOpen(true);
  }, [messages.length, att.attachment]);

  const confirmNewChat = useCallback(() => {
    setNewChatOpen(false);
    if (att.attachment) att.handleClearAttachment();
    setSavedTo({});
    clearChat();
  }, [att, clearChat]);

  const handleSaveCards = useCallback(async (setId: string, setTitle: string) => {
    const cardsToSave = saveModal.cards;
    try {
      await bulkCreateCards({ setId, cards: cardsToSave });
      Toast.show({ type: 'success', text1: t('ai:qm.chat.savedToast', { set: setTitle, defaultValue: `Saved to ${setTitle}` }) });
      markSaved(saveModal.messageId);
      setSavedTo(prev => ({ ...prev, [saveModal.messageId]: setTitle }));
      if (saveModal.chatId) markCardsSaved(saveModal.chatId);
      setSaveModal({ visible: false, cards: [], messageId: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: t('ai:chat.failedToSaveCards', 'Failed to save cards'), text2: getErrorMessage(e) });
      throw e;
    }
  }, [bulkCreateCards, saveModal, markCardsSaved, markSaved, t]);

  const targetBookmarked = target?.chatId ? bookmarkedChatIds.has(target.chatId) : false;

  const messageActions = useMemo<QMSheetAction[]>(() => {
    if (!target) return [];
    const base: QMSheetAction[] = [
      {
        label: t('common:actions.copy', 'Copy'), icon: CopyIcon,
        onPress: () => { Clipboard.setString(target.text); Toast.show({ type: 'success', text1: t('common:status.copiedToClipboard', 'Copied to clipboard') }); },
      },
      { label: t('common:actions.share', 'Share'), icon: ShareUpIcon, onPress: () => Share.share({ message: target.text }) },
    ];
    if (target.role !== 'ai') return base;
    return [
      ...base,
      {
        label: targetBookmarked ? t('ai:qm.chat.removeBookmark', 'Remove bookmark') : t('ai:qm.chat.bookmark', 'Bookmark'),
        icon: BookmarkIcon, off: !target.chatId,
        onPress: () => {
          const chatId = target.chatId;
          if (!chatId) return;
          if (targetBookmarked) removeBookmark(chatId, { onSuccess: () => Toast.show({ type: 'success', text1: t('ai:chat.bookmarkRemoved', 'Bookmark removed') }) });
          else addBookmark(chatId, { onSuccess: () => Toast.show({ type: 'success', text1: t('ai:chat.bookmarked', 'Bookmarked') }) });
        },
      },
      {
        label: t('ai:qm.chat.saveAsCard', 'Save as a card'), icon: CardsIcon,
        // Card limits are 300 / 1000 chars (cards.dto) — long answers are trimmed, not rejected.
        onPress: () => setSaveModal({ visible: true, cards: [{ question: truncate(target.userQuestion ?? target.text, CARD_Q_MAX), answer: truncate(target.text, CARD_A_MAX) }], messageId: target.id, chatId: target.chatId }),
      },
      { label: t('ai:qm.chat.askAgain', 'Ask again for a new answer'), icon: RefreshIcon, off: isPending, onPress: () => handleRegenerate(target) },
    ];
  }, [target, targetBookmarked, isPending, handleRegenerate, addBookmark, removeBookmark, t]);

  const menuActions: QMSheetAction[] = [
    { label: t('ai:qm.chat.history', 'Past conversations'), icon: ClockIcon, onPress: () => navigation.navigate('ChatHistory') },
    { label: t('ai:qm.chat.shareChat', 'Share this conversation'), icon: ShareUpIcon, off: !hasExportableMessages, onPress: handleExport },
  ];

  const lowCredits = creditBalance < MIN_MEDIA_COST;
  const attachActions: QMSheetAction[] = lowCredits ? [] : att.attachMenuActions.map(a => ({
    label: a.label, icon: a.icon, onPress: a.onPress,
    trailing: 'cost' in a && a.cost ? t('ai:qm.chat.credits', { count: a.cost }) : undefined,
  }));
  const mediaActions: QMSheetAction[] = att.pickerActions.flatMap(a => 'file' in a && a.file ? [{
    label: a.label, icon: a.icon, onPress: a.onPress,
    sub: `${a.file.type === 'PDF' ? 'PDF' : t('ai:qm.chat.photo', 'Photo')} · ${formatBytes(a.file.sizeBytes)}`,
    trailing: t('ai:qm.chat.credits', { count: a.file.type === 'PDF' ? 5 : 3 }),
  }] : []);

  const starters = useMemo<{ text: string; icon: IconComponent; bg: string; ink: string; cost?: string }[]>(() => [
    { text: t('ai:qm.starters.context', 'What is the historical context of Philippians 4:13?'), icon: ClockIcon, bg: qm.lilac, ink: qm.link },
    { text: t('ai:qm.starters.prodigal', 'Explain the parable of the Prodigal Son'), icon: BookIcon, bg: qm.goldBg, ink: qm.goldText },
    { text: t('ai:qm.starters.cards', 'Make 5 flashcards on the Armor of God in Ephesians 6'), icon: CardsIcon, bg: qm.leafBg, ink: qm.leaf, cost: t('ai:qm.chat.credits', { count: 2 }) },
    { text: t('ai:qm.starters.grace', 'What is the difference between grace and mercy?'), icon: SparklesIcon, bg: qm.lilac, ink: qm.link },
  ], [t, qm]);

  // ─── Render ───────────────────────────────────────────────────────────────

  const lastAiId = useMemo(() => [...messages].reverse().find(m => m.role === 'ai')?.id, [messages]);

  const renderItem = useCallback(({ item, index }: { item: ChatUIMessage; index: number }) => {
    const prev = messages[index - 1];
    return (
      <ChatMessageItem
        item={item}
        cost={item.role === 'ai' && prev?.role === 'user' && !item.isHistorical ? prev.creditsUsed : undefined}
        isLast={item.id === lastAiId}
        busy={isPending || isBalanceLoading}
        bookmarked={!!item.chatId && bookmarkedChatIds.has(item.chatId)}
        savedTo={savedTo[item.id] ?? (savedMessageIds.has(item.id) || undefined)}
        onMore={handleMore}
        onSend={handleSend}
        onRetry={handleRetry}
        onSaveCards={(cards, messageId, chatId) => setSaveModal({ visible: true, cards, messageId, chatId })}
      />
    );
  }, [messages, lastAiId, isPending, isBalanceLoading, bookmarkedChatIds, savedTo, savedMessageIds, handleMore, handleSend, handleRetry]);

  const welcome = (
    <View>
      <Animated.View entering={FadeInUp.duration(320)} style={styles.welcome}>
        <SparkMark size={46} small={false} />
        <Typography preset="qmEmptyTitle" color={qm.ink} align="center" style={styles.welcomeTitle}>
          {t('ai:qm.chat.welcomeTitle', 'What are you reading today?')}
        </Typography>
        <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.welcomeText}>
          {t('ai:qm.chat.welcomeText', 'Ask about a passage, get it explained with verses, or turn it into flashcards.')}
        </Typography>
      </Animated.View>
      <View style={styles.starters}>
        {starters.map((s, i) => (
          <Animated.View key={s.text} entering={FadeInUp.duration(320).delay(120 + i * 50)}>
            <AnimatedPressable
              scaleTo={0.97}
              onPress={() => handleSend(s.text)}
              disabled={isBalanceLoading || isPending}
              style={[styles.starter, { backgroundColor: qm.surface, boxShadow: qm.optLine }]}
              accessibilityRole="button"
            >
              <View style={[styles.starterTile, { backgroundColor: s.bg }]}>
                <s.icon size={16} color={s.ink} strokeWidth={2} />
              </View>
              <Typography preset="qmBodyMd" color={qm.ink} style={styles.flex}>{s.text}</Typography>
              {s.cost ? (
                <View style={[styles.costPill, { backgroundColor: qm.field }]}>
                  <Typography preset="qmChip" color={qm.muted}>{s.cost}</Typography>
                </View>
              ) : null}
            </AnimatedPressable>
          </Animated.View>
        ))}
      </View>
      <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.disclaimer}>
        {t('ai:qm.chat.disclaimer', 'AI answers point to Bible verses but can still make mistakes. Check important things with your pastor or a trusted commentary.')}
      </Typography>
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.bg }]} behavior="padding">
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.flex}>
          <Typography preset="qmDisplay" color={qm.ink} accessibilityRole="header">{t('ai:qm.chat.title', 'Ask')}</Typography>
          <Typography preset="qmMeta" color={qm.muted}>{t('ai:qm.chat.sub', 'Your Bible study helper')}</Typography>
        </View>
        <Pressable
          onPress={handleNewChat}
          style={({ pressed }) => [styles.round, { backgroundColor: qm.field }, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('ai:qm.chat.newChat', 'New conversation')}
        >
          <PlusIcon size={19} color={qm.ink} strokeWidth={2} />
        </Pressable>
        <Pressable
          onPress={() => setSheet('menu')}
          style={({ pressed }) => [styles.round, { backgroundColor: qm.field }, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('ai:qm.chat.moreA11y', 'More options')}
        >
          <MoreHorizontalIcon size={19} color={qm.ink} />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={welcome}
        renderItem={renderItem}
      />

      <ChatInput
        onSend={handleSend}
        working={isPending}
        disabled={isPending || isBalanceLoading}
        creditBalance={creditData ? creditBalance : undefined}
        attachmentName={att.attachment?.name ?? null}
        attachmentType={att.attachment?.type ?? (att.pendingLocalUri ? 'IMAGE' : 'PDF')}
        attachmentLocalUri={att.pendingLocalUri ?? att.attachment?.localUri ?? null}
        isUploading={att.isUploading}
        onAttachPress={att.handleAttachPress}
        onClearAttachment={att.handleClearAttachment}
        onUpgrade={goPaywall}
        onClaim={goCredits}
      />

      <QMSheet visible={sheet === 'menu'} onClose={() => setSheet(null)} actions={menuActions} />
      <QMSheet
        visible={sheet === 'message'}
        onClose={() => { setSheet(null); setTarget(null); }}
        title={target?.role === 'user' ? t('ai:chat.yourMessage', 'Your message') : t('ai:qm.chat.answer', 'Answer')}
        actions={messageActions}
      />

      <QMSheet
        visible={att.attachMenuVisible}
        onClose={() => att.setAttachMenuVisible(false)}
        title={att.isUploading ? t('common:status.uploading', 'Uploading…') : t('ai:chat.attachFile', 'Attach a file')}
        sub={lowCredits ? undefined : t('ai:qm.chat.attachSub', { balance: creditBalance, defaultValue: `A photo costs 3 credits, a PDF costs 5. You have ${creditBalance}.` })}
        actions={attachActions}
      >
        {lowCredits && (
          <View style={styles.sheetBody}>
            <View style={[styles.lowBox, { backgroundColor: qm.errorBg }]}>
              <InfoIcon size={18} color={qm.warm} strokeWidth={2} />
              <Typography preset="qmBodyMd" color={qm.ink} style={styles.flex}>
                {t('ai:qm.chat.lowCredits', { count: Math.max(creditBalance, 0), defaultValue: `You have ${Math.max(creditBalance, 0)} credits. Photos cost 3, PDFs 5.` })}
              </Typography>
            </View>
            <QMButton label={t('ai:qm.chat.getCredits', 'Get more credits')} onPress={() => { att.setAttachMenuVisible(false); goPaywall(); }} style={styles.sheetBtn} />
          </View>
        )}
      </QMSheet>

      <QMSheet
        visible={att.pickerVisible}
        onClose={() => att.setPickerVisible(false)}
        title={t('ai:qm.chat.fromMedia', 'From My Media')}
        sub={mediaActions.length ? t('ai:qm.chat.fromMediaSub', { balance: creditBalance, defaultValue: `Pick a file you saved before. You have ${creditBalance} credits.` }) : undefined}
        actions={mediaActions}
      >
        {mediaActions.length === 0 && (
          <View style={styles.noMedia}>
            <View style={[styles.noMediaTile, { backgroundColor: qm.lilac }]}>
              <DocIcon size={28} color={qm.link} strokeWidth={1.6} />
            </View>
            <Typography preset="qmSheetTitle" color={qm.ink} align="center" style={styles.noMediaTitle}>{t('ai:attach.noFiles', 'No files in My Media')}</Typography>
            <Typography preset="qmBodyMd" color={qm.muted} align="center">
              {t('ai:qm.chat.noMediaText', 'PDFs and photos you upload are kept there, so you can use them again.')}
            </Typography>
            <Pressable onPress={() => { att.setPickerVisible(false); goMedia(); }} style={styles.noMediaLink} accessibilityRole="link">
              <Typography preset="qmButton" color={qm.link}>{t('ai:qm.chat.openMedia', 'Open My Media')}</Typography>
            </Pressable>
          </View>
        )}
      </QMSheet>

      <CardProposalSheet visible={saveModal.visible} cards={saveModal.cards} onSave={handleSaveCards} onClose={() => setSaveModal({ visible: false, cards: [], messageId: '' })} />

      <QMConfirmDialog
        visible={newChatOpen}
        title={t('ai:qm.chat.newChatTitle', 'Start a new chat?')}
        message={t('ai:qm.chat.newChatText', 'This clears the current conversation. It stays in Past conversations.')}
        confirmLabel={t('ai:qm.chat.startNew', 'Start new')}
        cancelLabel={t('common:actions.cancel', 'Cancel')}
        onConfirm={confirmNewChat}
        onCancel={() => setNewChatOpen(false)}
      />

      {/* Content policy — one-time, before first attachment */}
      <QMConfirmDialog
        visible={att.policyDialogVisible}
        title={t('quiz:qm.policyTitle', 'Before you add a document')}
        message={t('quiz:qm.policyText', 'Only upload things you have the right to use, and keep them appropriate: nothing sexual, violent or illegal. Breaking this can get your account suspended.')}
        confirmLabel={t('quiz:qm.agree', 'I agree')}
        cancelLabel={t('quiz:qm.notNow', 'Not now')}
        onConfirm={att.acceptPolicy}
        onCancel={() => att.setPolicyDialogVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.xl, paddingRight: spacing.lg, paddingBottom: spacing.s10 },
  round: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  welcome: { alignItems: 'center', marginTop: spacing.s18 },
  welcomeTitle: { marginTop: spacing.md, marginBottom: spacing.s6 },
  welcomeText: { maxWidth: 300 },
  starters: { gap: spacing.sm, marginTop: spacing.s22 },
  starter: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.s13, paddingHorizontal: spacing.s14, borderRadius: radius.md,
  },
  starterTile: { width: STARTER_TILE, height: STARTER_TILE, borderRadius: radius.r10, alignItems: 'center', justifyContent: 'center' },
  costPill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  disclaimer: { marginTop: spacing.s18, marginHorizontal: spacing.sm },
  sheetBody: { paddingHorizontal: spacing.md },
  lowBox: { flexDirection: 'row', gap: spacing.s10, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.md, marginTop: spacing.s6 },
  sheetBtn: { marginTop: spacing.lg },
  noMedia: { alignItems: 'center', paddingTop: spacing.sm, paddingHorizontal: spacing.md },
  noMediaTile: { width: NO_MEDIA_TILE, height: NO_MEDIA_TILE, borderRadius: radius.r18, alignItems: 'center', justifyContent: 'center' },
  noMediaTitle: { marginTop: spacing.md, marginBottom: spacing.s6 },
  noMediaLink: { marginTop: spacing.md, minHeight: TOUCH, justifyContent: 'center' },
});
