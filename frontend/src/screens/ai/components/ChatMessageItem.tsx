import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable, Typography } from '../../../components/ui';
import {
  ArrowRightIcon, BookmarkSolidIcon, CardsIcon, CheckIcon, DocIcon, ImageIcon, InfoIcon, MoreHorizontalIcon, RefreshIcon,
} from '../../../components/icons';
import { useTheme, spacing, radius } from '../../../theme';
import type { ChatUIMessage } from '../../../store';
import type { SuggestedCard } from '../../../types';
import { FAILED, TYPING } from '../chatMarks';

const TOUCH = 40;
const DOT = 7;
const THUMB_W = 200;
const THUMB_H = 150;
const AURA = 2;
const CARDS_TILE = 34;

type Props = {
  item: ChatUIMessage;
  /** Credits the question behind this answer cost. */
  cost?: number;
  /** Follow-up chips only under the newest answer. */
  isLast: boolean;
  busy: boolean;
  bookmarked: boolean;
  /** Cards from this answer were saved (set name when known). */
  savedTo?: string | true;
  onMore: (item: ChatUIMessage) => void;
  onSend: (q: string) => void;
  onRetry: (item: ChatUIMessage) => void;
  onSaveCards: (cards: SuggestedCard[], messageId: string, chatId?: string) => void;
};

function formatTime(ts: number, lang: string): string {
  return new Date(ts).toLocaleTimeString(lang, { hour: 'numeric', minute: '2-digit' });
}

export const ChatMessageItem = React.memo(function ChatMessageItem({
  item, cost, isLast, busy, bookmarked, savedTo, onMore, onSend, onRetry, onSaveCards,
}: Props) {
  const { t, i18n } = useTranslation(['ai', 'common']);
  const { qm } = useTheme();
  const time = formatTime(item.timestamp, i18n.language || 'en');

  if (item.role === 'user') {
    const isImage = item.attachmentType === 'IMAGE' && !!item.attachmentLocalUri;
    return (
      <Animated.View entering={FadeInDown.duration(320).springify().damping(18)} style={styles.userCol}>
        {isImage && <Image source={{ uri: item.attachmentLocalUri }} style={styles.thumb} resizeMode="cover" />}
        <Pressable onLongPress={() => onMore(item)} style={[styles.userBubble, { backgroundColor: qm.violet }]}>
          {!isImage && item.attachmentName ? (
            <View style={[styles.sentFile, { backgroundColor: qm.badgeOnViolet }]}>
              {item.attachmentType === 'IMAGE' ? <ImageIcon size={16} color={qm.onViolet} strokeWidth={2} /> : <DocIcon size={16} color={qm.onViolet} strokeWidth={2} />}
              <Typography preset="qmChip" color={qm.onViolet} numberOfLines={1} style={styles.flex}>{item.attachmentName}</Typography>
            </View>
          ) : null}
          <Typography preset="qmBodyMd" color={qm.onViolet}>{item.text}</Typography>
        </Pressable>
        <View style={styles.userFoot}>
          <Typography preset="qmFine" color={qm.muted}>{time}</Typography>
          <Pressable onPress={() => onMore(item)} style={styles.footBtn} accessibilityRole="button" accessibilityLabel={t('ai:qm.chat.messageOptions', 'Message options')}>
            <MoreHorizontalIcon size={16} color={qm.muted} />
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  if (item.text === TYPING) {
    return (
      <View style={[styles.aura, { borderColor: qm.violet }]}>
        <View style={[styles.typing, { backgroundColor: qm.surface }]} accessibilityRole="progressbar" accessibilityLabel={t('ai:qm.chat.writing', 'Writing an answer…')}>
          <TypingDots />
          <Typography preset="qmBody" color={qm.muted}>{t('ai:qm.chat.writing', 'Writing an answer…')}</Typography>
        </View>
      </View>
    );
  }

  if (item.text === FAILED) {
    return (
      <Animated.View entering={FadeInUp.duration(320)} style={[styles.answer, styles.failed, { backgroundColor: qm.surface, boxShadow: qm.optLine }]} accessibilityRole="alert">
        <View style={styles.failRow}>
          <InfoIcon size={20} color={qm.warm} strokeWidth={2} />
          <View style={styles.flex}>
            <Typography preset="qmSegment" color={qm.ink}>{t('ai:qm.chat.failedTitle', 'Couldn’t get an answer')}</Typography>
            <Typography preset="qmBody" color={qm.muted} style={styles.failText}>
              {item.errorText || t('ai:qm.chat.failedText', 'Check your connection and try again.')}
            </Typography>
          </View>
        </View>
        <AnimatedPressable scaleTo={0.97} disabled={busy} onPress={() => onRetry(item)} style={[styles.retry, { backgroundColor: qm.lilac }]} accessibilityRole="button">
          <RefreshIcon size={15} color={qm.lilacInk} strokeWidth={2.2} />
          <Typography preset="qmLink" color={qm.lilacInk}>{t('ai:qm.chat.tryAgain', 'Try again')}</Typography>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  const cards = item.suggestedCards ?? [];
  const meta = cost ? `${time} · ${t('ai:qm.chat.credits', { count: cost, defaultValue: cost === 1 ? '1 credit' : `${cost} credits` })}` : time;

  return (
    <Animated.View entering={FadeInUp.duration(320)}>
      <Pressable onLongPress={() => onMore(item)} style={[styles.answer, { backgroundColor: qm.surface, boxShadow: qm.optLine }]}>
        <Markdown text={item.text} />
        <View style={styles.answerFoot}>
          <Typography preset="qmFine" color={qm.muted}>{meta}</Typography>
          <Pressable onPress={() => onMore(item)} style={styles.footBtn} accessibilityRole="button" accessibilityLabel={t('ai:qm.chat.answerOptions', 'Answer options')}>
            <MoreHorizontalIcon size={18} color={qm.muted} />
          </Pressable>
        </View>
        {bookmarked && (
          <View style={styles.ribbon} accessibilityLabel={t('ai:chat.bookmarked', 'Bookmarked')}>
            <BookmarkSolidIcon size={18} color={qm.goldText} />
          </View>
        )}
      </Pressable>

      {cards.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.cards, { backgroundColor: savedTo ? qm.leafBg : qm.lilac }]}>
          <View style={[styles.cardsTile, { backgroundColor: qm.surface }]}>
            <CardsIcon size={18} color={savedTo ? qm.leafText : qm.lilacInk} strokeWidth={2} />
          </View>
          <Typography preset="qmSegment" color={savedTo ? qm.leafText : qm.lilacInk} style={styles.flex}>
            {savedTo
              ? typeof savedTo === 'string'
                ? t('ai:qm.chat.cardsSavedTo', { count: cards.length, set: savedTo, defaultValue: `${cards.length} cards saved to ${savedTo}` })
                : t('ai:qm.chat.cardsSaved', { count: cards.length, defaultValue: `${cards.length} cards saved` })
              : t('ai:chat.cardsReady', { count: cards.length })}
          </Typography>
          {savedTo ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.savedChip}>
              <CheckIcon size={18} color={qm.leaf} strokeWidth={2.6} />
              <Typography preset="qmLink" color={qm.leafText}>{t('common:status.saved', 'Saved')}</Typography>
            </Animated.View>
          ) : (
            <AnimatedPressable
              scaleTo={0.95}
              onPress={() => onSaveCards(cards, item.id, item.chatId)}
              style={[styles.saveBtn, { backgroundColor: qm.violet }]}
              accessibilityRole="button"
            >
              <Typography preset="qmLink" color={qm.onViolet}>{t('ai:qm.chat.saveToSet', 'Save to a set')}</Typography>
            </AnimatedPressable>
          )}
        </Animated.View>
      )}

      {isLast && item.followUps && item.followUps.length > 0 && (
        <Animated.View entering={FadeIn.duration(240)}>
          <Typography preset="qmMeta" color={qm.muted} style={styles.keepGoing}>{t('ai:qm.chat.keepGoing', 'Keep going')}</Typography>
          <View style={styles.followUps}>
            {item.followUps.map(q => (
              <AnimatedPressable
                key={q}
                scaleTo={0.97}
                disabled={busy}
                onPress={() => onSend(q)}
                style={[styles.followUp, { backgroundColor: qm.lilac }]}
                accessibilityRole="button"
              >
                <ArrowRightIcon size={14} color={qm.lilacInk} strokeWidth={2.2} />
                <Typography preset="qmBody" color={qm.lilacInk} style={styles.followText}>{q}</Typography>
              </AnimatedPressable>
            ))}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
});

// ── Breathing dots ───────────────────────────────────────────────────────────

function Dot({ delay }: { delay: number }) {
  const { qm } = useTheme();
  const v = useSharedValue(0.3);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })), -1));
    return () => cancelAnimation(v);
  }, [delay, v]);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.8 + v.value * 0.2 }] }));
  return <Animated.View style={[styles.dot, { backgroundColor: qm.muted }, style]} />;
}

function TypingDots() {
  return (
    <View style={styles.dots}>
      <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
    </View>
  );
}

// ── Minimal markdown: **bold**, *italic*, "- " bullets, blank-line paragraphs ─

/** Same text without the markdown marks (one-line previews). */
export const plainText = (text: string) => text.replace(/\*\*([^*]+?)\*\*/g, '$1').replace(/\*([^*\s][^*]*?)\*/g, '$1').replace(/^\s*[-*•]\s+/gm, '');

function Inline({ text }: { text: string }) {
  const { qm } = useTheme();
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*)/);
  return (
    <>
      {parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
        ? <Typography key={i} preset="qmChatBold" color={qm.ink}>{p.slice(2, -2)}</Typography>
        : p.length > 2 && p.startsWith('*') && p.endsWith('*')
          ? <Typography key={i} preset="qmChat" color={qm.body} style={styles.italic}>{p.slice(1, -1)}</Typography>
          : p)}
    </>
  );
}

export function Markdown({ text }: { text: string }) {
  const { qm } = useTheme();
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <View style={styles.md}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim().length > 0);
        if (!lines.some(l => /^[-*•]\s/.test(l.trim()))) {
          return <Typography key={bi} preset="qmChat" color={qm.body}><Inline text={lines.join('\n')} /></Typography>;
        }
        return (
          <View key={bi} style={styles.bullets}>
            {lines.map((line, li) => {
              const l = line.trim();
              // A lead-in line inside a list ("In essence:") stays flush left.
              if (!/^[-*•]\s/.test(l)) return <Typography key={li} preset="qmChat" color={qm.body}><Inline text={l} /></Typography>;
              return (
                <View key={li} style={styles.bulletRow}>
                  <Typography preset="qmChat" color={qm.body} style={styles.bulletDot}>•</Typography>
                  <Typography preset="qmChat" color={qm.body} style={styles.flex}><Inline text={l.replace(/^[-*•]\s+/, '')} /></Typography>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  userCol: { alignItems: 'flex-end', marginTop: spacing.s10 },
  thumb: { width: THUMB_W, height: THUMB_H, borderRadius: radius.r18, marginBottom: spacing.xs },
  userBubble: {
    maxWidth: '82%', paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.r20, borderTopRightRadius: radius.r20, borderBottomLeftRadius: radius.r20, borderBottomRightRadius: radius.r6,
  },
  sentFile: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: -spacing.s2, marginHorizontal: -spacing.s6, marginBottom: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.s10, borderRadius: radius.r12,
  },
  userFoot: { flexDirection: 'row', alignItems: 'center', gap: spacing.s2, marginTop: spacing.s2, marginRight: -spacing.sm },
  footBtn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  aura: {
    alignSelf: 'flex-start', marginTop: spacing.s10, borderWidth: AURA,
    borderTopLeftRadius: radius.r21 + 1, borderTopRightRadius: radius.r21 + 1, borderBottomRightRadius: radius.r21 + 1, borderBottomLeftRadius: radius.sm,
  },
  typing: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.s10, paddingVertical: spacing.s13, paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.r20, borderTopRightRadius: radius.r20, borderBottomRightRadius: radius.r20, borderBottomLeftRadius: radius.r6,
  },
  dots: { flexDirection: 'row', gap: spacing.s5 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  answer: {
    alignSelf: 'flex-start', maxWidth: '94%', marginTop: spacing.s10,
    paddingTop: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs,
    borderTopLeftRadius: radius.r20, borderTopRightRadius: radius.r20, borderBottomRightRadius: radius.r20, borderBottomLeftRadius: radius.r6,
  },
  answerFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, marginRight: -spacing.sm },
  ribbon: { position: 'absolute', top: -spacing.s6, right: spacing.s14 },
  // Fixed width: its flex text would otherwise shrink the card to the icon.
  failed: { width: '94%' },
  failRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10 },
  failText: { marginTop: spacing.s2 },
  retry: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    height: TOUCH, paddingHorizontal: spacing.lg, borderRadius: radius.r12, marginTop: spacing.md, marginBottom: spacing.md,
  },
  cards: {
    maxWidth: '94%', flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing.s10, paddingVertical: spacing.md, paddingLeft: spacing.s14, paddingRight: spacing.md, borderRadius: radius.r18,
  },
  cardsTile: { width: CARDS_TILE, height: CARDS_TILE, borderRadius: radius.r10 + 1, alignItems: 'center', justifyContent: 'center' },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingRight: spacing.s6 },
  saveBtn: { height: TOUCH, paddingHorizontal: spacing.s14, borderRadius: radius.r12, alignItems: 'center', justifyContent: 'center' },
  keepGoing: { marginTop: spacing.lg, marginBottom: spacing.sm },
  followUps: { alignItems: 'flex-start', gap: spacing.sm },
  followUp: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.s10, paddingHorizontal: spacing.s14, borderRadius: radius.pill, maxWidth: '100%',
  },
  followText: { flexShrink: 1 },
  md: { gap: spacing.sm },
  bullets: { gap: spacing.xs },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletDot: { width: spacing.md },
  italic: { fontStyle: 'italic' },
});
