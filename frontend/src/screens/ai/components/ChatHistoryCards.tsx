import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { AnimatedPressable, Typography } from '../../../components/ui';
import { ArrowRightIcon, BookmarkSolidIcon, ChevronDownIcon, ChevronUpIcon, MoreVerticalIcon } from '../../../components/icons';
import { qmRowEnter } from '../../../components/qm';
import { useTheme, spacing, radius } from '../../../theme';
import { formatDate } from '../../../utils/formatters';
import type { BookmarkedChat, ChatSession } from '../../../types';
import { Markdown, plainText } from './ChatMessageItem';

const TOUCH = 40;

// Tag values are stored/filtered in English; only the DISPLAY is translated.
const TAG_KEY: Record<string, string> = {
  'Theology': 'theology', 'Old Testament': 'oldTestament', 'New Testament': 'newTestament',
  'Prayer': 'prayer', 'History': 'history', 'Devotional': 'devotional', 'Prophecy': 'prophecy',
};
export const tagLabel = (tag: string, t: TFunction) => t(`ai:tags.${TAG_KEY[tag] ?? tag}`, { defaultValue: tag });

export interface SessionCardProps {
  session: ChatSession;
  index: number;
  onMore: (session: ChatSession) => void;
  onContinue: (session: ChatSession) => void;
}

/** One past conversation: title, topics + meta, ⋮, tap to peek at its Q&A, "Continue". */
export const SessionCard = React.memo(function SessionCard({ session, index, onMore, onContinue }: SessionCardProps) {
  const { t } = useTranslation(['ai', 'common']);
  const { qm } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const title = session.customTitle || session.title;
  const meta = `${t('ai:history.questionsCount', { count: session.messageCount })} · ${t('ai:qm.chat.credits', { count: session.totalCreditsUsed })}`;

  const handleMore = useCallback(() => onMore(session), [onMore, session]);
  const handleContinue = useCallback(() => onContinue(session), [onContinue, session]);

  return (
    <Animated.View entering={qmRowEnter(index)} style={[styles.card, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <View style={styles.top}>
        <Pressable
          onPress={() => setExpanded(e => !e)}
          onLongPress={handleMore}
          style={styles.flex}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={expanded ? undefined : 2}>{title}</Typography>
          <View style={styles.metaRow}>
            {session.tags?.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmChip" color={qm.goldText}>{tagLabel(tag, t)}</Typography>
              </View>
            ))}
            <Typography preset="qmMeta" color={qm.muted}>{meta}</Typography>
          </View>
        </Pressable>
        <Pressable onPress={handleMore} style={({ pressed }) => [styles.more, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('ai:qm.history.options', 'Conversation options')}>
          <MoreVerticalIcon size={18} color={qm.muted} />
        </Pressable>
      </View>

      {expanded && (
        <Animated.View entering={FadeInUp.duration(320)} style={styles.pairs}>
          {session.messages.map(m => (
            <View key={m.id} style={[styles.pair, { borderTopColor: qm.hair }]}>
              <Typography preset="qmLink" color={qm.ink}>{m.question}</Typography>
              <Typography preset="qmBody" color={qm.body} numberOfLines={2} style={styles.pairA}>{plainText(m.answer)}</Typography>
            </View>
          ))}
        </Animated.View>
      )}

      <AnimatedPressable scaleTo={0.98} onPress={handleContinue} style={[styles.continue, { borderTopColor: qm.hair }]} accessibilityRole="button">
        <Typography preset="qmLink" color={qm.link}>{t('ai:qm.history.continue', 'Continue this conversation')}</Typography>
        <ArrowRightIcon size={16} color={qm.link} strokeWidth={2} />
      </AnimatedPressable>
    </Animated.View>
  );
});

/** A bookmarked answer: ribbon + question, tap to read the answer. */
export const BookmarkCard = React.memo(function BookmarkCard({ chat, index }: { chat: BookmarkedChat; index: number }) {
  const { t } = useTranslation(['ai', 'common']);
  const { qm } = useTheme();
  const [expanded, setExpanded] = useState(false);
  return (
    <Animated.View entering={qmRowEnter(index)}>
      <AnimatedPressable
        scaleTo={0.98}
        onPress={() => setExpanded(e => !e)}
        style={[styles.mark, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.markTop}>
          <View style={styles.ribbon}><BookmarkSolidIcon size={18} color={qm.goldText} /></View>
          <Typography preset="qmBodyLg" color={qm.ink} style={styles.flex} numberOfLines={expanded ? undefined : 2}>{chat.question}</Typography>
          {expanded ? <ChevronUpIcon size={18} color={qm.muted} strokeWidth={2} /> : <ChevronDownIcon size={18} color={qm.muted} strokeWidth={2} />}
        </View>
        {expanded && (
          <Animated.View entering={FadeInUp.duration(320)}>
            <View style={styles.markA}><Markdown text={chat.answer} /></View>
          </Animated.View>
        )}
        <Typography preset="qmMeta" color={qm.muted} style={styles.markDate}>
          {t('ai:chat.bookmarkedAt', { date: formatDate(chat.bookmarkedAt) })}
        </Typography>
      </AnimatedPressable>
    </Animated.View>
  );
});

/** Loading placeholder: three soft cards pulsing (no shimmer). */
export function HistorySkeleton() {
  const { qm } = useTheme();
  const v = useSharedValue(1);
  useEffect(() => {
    v.value = withRepeat(withTiming(0.5, { duration: 700 }), -1, true);
    return () => cancelAnimation(v);
  }, [v]);
  const pulse = useAnimatedStyle(() => ({ opacity: v.value }));
  const bar = (w: `${number}%` | number, h: number) => <Animated.View style={[{ width: w, height: h, borderRadius: h / 2, backgroundColor: qm.field }, pulse]} />;
  return (
    <View style={styles.skel} accessibilityRole="progressbar">
      {bar(70, 12)}
      {(['78%', '62%', '70%'] as const).map(w => (
        <View key={w} style={[styles.skelCard, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          {bar(w, 16)}
          <View style={styles.skelRow}>{bar(96, 22)}{bar(120, 14)}</View>
          <View style={[styles.skelLine, { backgroundColor: qm.hair }]} />
          {bar(180, 14)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  card: { borderRadius: radius.r20, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, paddingTop: spacing.s14, paddingBottom: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.s6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.s6, marginTop: spacing.sm },
  tag: { paddingVertical: spacing.xs, paddingHorizontal: spacing.s10 - 1, borderRadius: radius.pill },
  more: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, marginTop: -spacing.sm, alignItems: 'center', justifyContent: 'center' },
  pairs: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  pair: { paddingVertical: spacing.s10, borderTopWidth: StyleSheet.hairlineWidth },
  pairA: { marginTop: spacing.xs },
  continue: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth,
  },
  mark: { borderRadius: radius.r20, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg },
  markTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10 },
  ribbon: { marginTop: spacing.s2 },
  markA: { marginTop: spacing.s10 },
  markDate: { marginTop: spacing.sm },
  skel: { marginTop: spacing.s22, gap: spacing.s10 },
  skelCard: { borderRadius: radius.r20, padding: spacing.lg },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  skelLine: { height: StyleSheet.hairlineWidth, marginVertical: spacing.s14, marginHorizontal: -spacing.lg },
});
