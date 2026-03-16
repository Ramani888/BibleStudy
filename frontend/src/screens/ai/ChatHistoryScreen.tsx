import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { EmptyState, ErrorState } from '../../components/feedback';
import { Card, Divider, Spacer, Typography } from '../../components/ui';
import { useAIChatHistory } from '../../hooks';
import { formatDate } from '../../utils/formatters';
import { colors, layout, spacing } from '../../theme';
import type { AIChat } from '../../types';

interface HistoryItemProps {
  chat: AIChat;
}

function HistoryItem({ chat }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(e => !e)}>
      <Card style={styles.item}>
        {/* Question */}
        <View style={styles.questionRow}>
          <View style={styles.qBadge}>
            <Typography preset="caption" color={colors.info} style={styles.qLabel}>Q</Typography>
          </View>
          <Typography preset="body" style={styles.flex} numberOfLines={expanded ? undefined : 2}>
            {chat.question}
          </Typography>
        </View>

        {/* Answer — shown when expanded */}
        {expanded && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Divider marginV={spacing[3]} />
            <View style={styles.answerRow}>
              <View style={styles.aBadge}>
                <Typography preset="caption" color={colors.success} style={styles.qLabel}>✦</Typography>
              </View>
              <Typography preset="body" color={colors.textSecondary} style={styles.flex}>
                {chat.answer}
              </Typography>
            </View>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Typography preset="caption" color={colors.textDisabled}>
            {formatDate(chat.createdAt)}
          </Typography>
          <View style={styles.creditPill}>
            <Typography preset="caption" color={colors.primaryDark}>
              −{chat.creditsUsed} credit
            </Typography>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function ChatHistoryScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAIChatHistory();

  const chats = data?.pages.flatMap(p => p.chats) ?? [];

  if (isError) return <ErrorState message="Could not load history." onRetry={refetch} />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        ItemSeparatorComponent={() => <Spacer size={spacing[3]} />}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No chat history yet"
              subtitle="Your conversations with the AI assistant will appear here"
            />
          ) : (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        renderItem={({ item }) => <HistoryItem chat={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundSecondary },
  list: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing[10],
    flexGrow: 1,
  },
  item: {
    gap: spacing[3],
    backgroundColor: colors.background,
  },

  // Question row
  questionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  answerRow: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  qBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  aBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  qLabel: { fontWeight: '700', fontSize: 10 },
  flex: { flex: 1 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: 999,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing[20] },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
});
