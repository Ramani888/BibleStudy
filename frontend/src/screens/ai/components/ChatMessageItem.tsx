import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ChatBubble } from '../../../components/domain';
import { AlbumsIcon, ArrowRightIcon, CheckCircleIcon, FileTextIcon } from '../../../components/icons';
import { Typography } from '../../../components/ui';
import { layout, radius, spacing } from '../../../theme';
import type { ChatUIMessage } from '../../../store';
import type { SuggestedCard } from '../../../types';

const TYPING_INDICATOR = '__typing__' as const;

type Props = {
  item: ChatUIMessage;
  userName?: string | null | undefined;
  userImage?: string | null | undefined;
  isPending: boolean;
  isBalanceLoading: boolean;
  savedMessageIds: Set<string>;
  colors: Record<string, string>;
  onLongPress: (item: ChatUIMessage) => void;
  onSend: (q: string) => void;
  onSaveCards: (cards: SuggestedCard[], messageId: string, chatId?: string) => void;
};

export function ChatMessageItem({
  item, userName, userImage,
  isPending, isBalanceLoading, savedMessageIds, colors,
  onLongPress, onSend, onSaveCards,
}: Props) {
  return (
    <View>
      {item.role === 'user' && item.attachmentType === 'IMAGE' && item.attachmentLocalUri ? (
        <Image source={{ uri: item.attachmentLocalUri }} style={styles.msgImageThumb} resizeMode="cover" />
      ) : item.role === 'user' && item.attachmentName ? (
        <View style={[styles.attachmentChip, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
          <FileTextIcon size={14} color={colors.accent} />
          <Typography preset="caption" color={colors.accent} numberOfLines={1} style={styles.attachmentChipText}>
            {item.attachmentName}
          </Typography>
        </View>
      ) : null}

      <Pressable onLongPress={() => onLongPress(item)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <ChatBubble
          role={item.role}
          text={item.text}
          creditsUsed={item.creditsUsed}
          userName={userName ?? undefined}
          userImage={userImage ?? undefined}
          isTyping={item.text === TYPING_INDICATOR}
          timestamp={item.text !== TYPING_INDICATOR ? item.timestamp : undefined}
        />
      </Pressable>

      {item.role === 'ai' && item.text !== TYPING_INDICATOR && item.followUps && item.followUps.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.followUps}>
          {item.followUps.map((q, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.followUpChip, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => onSend(q)}
              disabled={isPending || isBalanceLoading}
            >
              <ArrowRightIcon size={12} color={colors.accent} />
              <Typography preset="caption" color={colors.accent} style={styles.followUpText}>{q}</Typography>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {item.role === 'ai' && item.text !== TYPING_INDICATOR && item.suggestedCards && item.suggestedCards.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.cardBanner, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
          <AlbumsIcon size={16} color={colors.accent} />
          <Typography preset="bodySm" color={colors.accent} style={styles.cardBannerText}>
            {item.suggestedCards.length} flashcard{item.suggestedCards.length !== 1 ? 's' : ''} ready
          </Typography>
          {savedMessageIds.has(item.id) ? (
            <View style={styles.savedChip}>
              <CheckCircleIcon size={14} color={colors.success} />
              <Typography preset="caption" color={colors.success}> Saved</Typography>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.saveToSetBtn, { backgroundColor: colors.accent }, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => onSaveCards(item.suggestedCards!, item.id, item.chatId)}
              hitSlop={8}
            >
              <Typography preset="caption" color={colors.textOnAccent}>Save to Set</Typography>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  msgImageThumb: {
    width: 200, height: 150, borderRadius: layout.cardRadius,
    alignSelf: 'flex-end', marginRight: spacing.lg, marginBottom: spacing.xs,
  },
  attachmentChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    alignSelf: 'flex-end', maxWidth: '80%',
    marginRight: spacing.lg, marginBottom: spacing.xs,
    borderWidth: 1, borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.md, paddingVertical: spacing.s6,
  },
  attachmentChipText: { flexShrink: 1 },
  followUps: {
    paddingLeft: spacing.huge, paddingRight: spacing.lg,
    gap: spacing.sm, marginTop: -spacing.xs, marginBottom: spacing.md,
  },
  followUpChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    borderRadius: layout.pillRadius, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: spacing.s6,
    alignSelf: 'flex-start',
  },
  followUpText: { flexShrink: 1 },
  cardBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.sm, marginLeft: spacing.huge, marginRight: spacing.lg,
    marginBottom: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.r10, borderWidth: 1,
  },
  cardBannerText: { flex: 1 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  saveToSetBtn: { borderRadius: radius.sm, paddingVertical: spacing.s6, paddingHorizontal: spacing.md },
});
