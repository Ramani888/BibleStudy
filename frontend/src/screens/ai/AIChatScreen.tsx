import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { ChatBubble } from '../../components/domain';
import { CreditBadge } from '../../components/domain';
import { Typography } from '../../components/ui';
import { ChatInput } from './components/ChatInput';
import { useAuthStore } from '../../store';
import { useAIChat } from '../../hooks';
import { useCreditBalance } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { AIStackParamList } from '../../navigation/types';

type AINav = NativeStackNavigationProp<AIStackParamList>;

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  creditsUsed?: number;
}

// ─── Suggested starter questions ─────────────────────────────────────────────
const SUGGESTIONS = [
  'What does the Gospel of John teach about eternal life?',
  'Explain the Sermon on the Mount',
  'What is the significance of the Psalms?',
  'Who were the twelve apostles?',
];

export function AIChatScreen() {
  const user = useAuthStore(s => s.user);
  const navigation = useNavigation<AINav>();
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);

  const { mutate: sendMessage, isPending } = useAIChat();
  const { data: creditData } = useCreditBalance();
  const creditBalance = creditData?.balance ?? user?.creditBalance ?? 0;

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
        { id: `${userMsgId}_typing`, role: 'ai', text: '__typing__' },
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Typography style={styles.aiBadgeIcon}>✦</Typography>
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
          <Pressable onPress={() => navigation.navigate('ChatHistory')} hitSlop={8}>
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
            <Typography style={styles.emptyEmoji}>✦</Typography>
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
        renderItem={({ item }) => (
          <ChatBubble
            role={item.role}
            text={item.text}
            creditsUsed={item.creditsUsed}
            userName={user?.name}
            userImage={user?.profileImage}
          />
        )}
      />

      {/* ── Input ── */}
      <ChatInput
        onSend={handleSend}
        disabled={isPending}
        creditBalance={creditBalance}
      />
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
  aiBadgeIcon: { fontSize: 18, color: colors.textOnPrimary },

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
  emptyEmoji: {
    fontSize: 48,
    color: colors.primary,
    lineHeight: 60,
    marginBottom: spacing[2],
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
