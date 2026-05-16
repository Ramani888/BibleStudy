import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { ChatBubble } from '../../components/domain';
import { CreditBadge } from '../../components/domain';
import { ConfirmDialog } from '../../components/feedback';
import { Typography } from '../../components/ui';

const ICON_SIZE = 20;
const EMPTY_ICON_SIZE = 48;
import { ChatInput } from './components/ChatInput';
import { useAuthStore } from '../../store';
import { useAIChat, useConfirmDialog } from '../../hooks';
import { useCreditBalance } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { AIScreenProps } from '../../navigation/types';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  creditsUsed?: number;
}

const TYPING_INDICATOR = '__typing__' as const;

// ─── Suggested starter questions ─────────────────────────────────────────────
const SUGGESTIONS = [
  'What does the Gospel of John teach about eternal life?',
  'Explain the Sermon on the Mount',
  'What is the significance of the Psalms?',
  'Who were the twelve apostles?',
];

export function AIChatScreen({ navigation }: AIScreenProps<'AIChat'>) {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);
  const { show, dialogProps } = useConfirmDialog();

  const { mutate: sendMessage, isPending } = useAIChat();
  const { data: creditData } = useCreditBalance();
  const creditBalance = creditData?.balance ?? 0;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = useCallback(
    (question: string) => {
      if (creditBalance <= 0) {
        Toast.show({
          type: 'error',
          text1: 'No credits',
          text2: 'Claim your daily credit from the Home screen.',
        });
        return;
      }

      // Add user message immediately
      const userMsgId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        { id: userMsgId, role: 'user', text: question, creditsUsed: 1 },
        { id: `${userMsgId}_typing`, role: 'ai', text: TYPING_INDICATOR },
      ]);

      sendMessage(
        { question },
        {
          onSuccess: data => {
            setMessages(prev =>
              prev
                .filter(m => m.id !== `${userMsgId}_typing`)
                .concat({ id: `${userMsgId}_ai`, role: 'ai', text: data.answer }),
            );
          },
          onError: err => {
            // Remove typing indicator and show error
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
    [creditBalance, sendMessage],
  );

  const handleClearChat = () => {
    if (messages.length === 0) return;
    show({
      title: 'New Conversation',
      message: 'Clear the current chat and start fresh?',
      confirmLabel: 'Clear',
      variant: 'danger',
      onConfirm: () => setMessages([]),
    });
  };

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <Pressable
      onLongPress={() => {
        if (item.text !== TYPING_INDICATOR) {
          Share.share({ message: item.text });
        }
      }}
    >
      <ChatBubble
        role={item.role}
        text={item.text}
        creditsUsed={item.creditsUsed}
        userName={user?.name}
        userImage={user?.profileImage}
      />
    </Pressable>
  ), [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Icon name="sparkles" size={ICON_SIZE} color={colors.primary} />
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
          <Pressable onPress={handleClearChat} hitSlop={8}>
            <Icon name="trash-outline" size={ICON_SIZE} color={messages.length > 0 ? colors.textSecondary : colors.textDisabled} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ChatHistory')} hitSlop={8} style={styles.historyBtn}>
            <Icon name="time-outline" size={ICON_SIZE} color={colors.primary} />
            <Typography preset="label" color={colors.primary}>History</Typography>
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

            {/* Suggestions */}
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <Pressable
                  key={s}
                  style={({ pressed }) => [styles.suggestion, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => handleSend(s)}
                >
                  <Typography preset="bodySm" color={colors.primary}>
                    {s}
                  </Typography>
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
        disabled={isPending}
        creditBalance={creditBalance}
      />

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
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

  // Messages
  list: {
    padding: layout.screenPaddingH,
    paddingTop: spacing[4],
    flexGrow: 1,
  },

  // Empty state
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
});
