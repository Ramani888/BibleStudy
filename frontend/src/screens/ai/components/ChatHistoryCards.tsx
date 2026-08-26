import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  ArrowRightIcon,
  ChatIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  StarIcon,
} from '../../../components/icons';
import { Card, Divider, Typography } from '../../../components/ui';
import { CARD_FILL_LIGHT, useTheme, fontSizes, fontWeights, layout, radius, spacing } from '../../../theme';
import { formatDate } from '../../../utils/formatters';
import type { AIChat, BookmarkedChat, ChatSession } from '../../../types';

const BADGE_ICON_SIZE = 12;
const CHEVRON_SIZE = 16;
const SESSION_ICON_SIZE = 14;

const MessagePair = React.memo(function MessagePair({ chat, index }: { chat: AIChat; index: number }) {
  const { t } = useTranslation(['library', 'common']);
  const { colors } = useTheme();
  return (
    <>
      {index > 0 && <Divider marginV={spacing.md} />}
      <View style={styles.qRow}>
        <View style={[styles.qBadge, { backgroundColor: colors.infoSurface }]}>
          <Typography preset="caption" color={colors.info} style={styles.badgeLabel}>{t('library:cards.questionLetter', 'Q')}</Typography>
        </View>
        <Typography preset="body" style={styles.flex}>{chat.question}</Typography>
      </View>
      <View style={[styles.aRow, styles.aRowWithMargin]}>
        <View style={[styles.aBadge, { backgroundColor: colors.accentSoft }]}>
          <SparklesIcon size={BADGE_ICON_SIZE} color={colors.accent} />
        </View>
        <Typography preset="body" color={colors.textSecondary} style={styles.flex}>
          {chat.answer}
        </Typography>
      </View>
    </>
  );
});

export const BookmarkCard = React.memo(function BookmarkCard({ chat }: { chat: BookmarkedChat }) {
  const { t } = useTranslation(['ai', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded(e => !e)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Card style={{ ...styles.card, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }}>
        <View style={styles.titleRow}>
          <View style={[styles.sessionIcon, { backgroundColor: colors.warningSurface }]}>
            <StarIcon size={SESSION_ICON_SIZE} color={colors.warning} />
          </View>
          <Typography preset="body" style={[styles.flex, styles.sessionTitle]} numberOfLines={expanded ? undefined : 2}>
            {chat.question}
          </Typography>
          {expanded
            ? <ChevronUpIcon size={CHEVRON_SIZE} color={colors.textSecondary} />
            : <ChevronDownIcon size={CHEVRON_SIZE} color={colors.textSecondary} />}
        </View>
        {expanded && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Divider marginV={spacing.md} />
            <View style={styles.aRow}>
              <View style={[styles.aBadge, { backgroundColor: colors.accentSoft }]}>
                <SparklesIcon size={BADGE_ICON_SIZE} color={colors.accent} />
              </View>
              <Typography preset="body" color={colors.textSecondary} style={styles.flex}>
                {chat.answer}
              </Typography>
            </View>
          </Animated.View>
        )}
        <Typography preset="caption" color={colors.textDisabled} style={styles.bookmarkDate}>
          {t('ai:chat.bookmarkedAt', { date: formatDate(chat.bookmarkedAt), defaultValue: `Bookmarked ${formatDate(chat.bookmarkedAt)}` })}
        </Typography>
      </Card>
    </Pressable>
  );
});

export interface SessionCardProps {
  session: ChatSession;
  onLongPress: (session: ChatSession) => void;
  onContinue: (session: ChatSession) => void;
}

import { useTranslation } from 'react-i18next';

export const SessionCard = React.memo(function SessionCard({ session, onLongPress, onContinue }: SessionCardProps) {
  const { t } = useTranslation(['ai', 'profile', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const [expanded, setExpanded] = useState(false);
  const questionLabel = session.messageCount === 1 ? t('ai:chat.question', 'question') : t('ai:chat.questions', 'questions');
  const creditLabel = session.totalCreditsUsed === 1 ? t('profile:credits.credit', 'credit') : t('profile:credits.credits', 'credits');
  const displayTitle = session.customTitle || session.title;

  const handleToggle = useCallback(() => setExpanded(e => !e), []);
  const handleLongPress = useCallback(() => onLongPress(session), [onLongPress, session]);
  const handleContinue = useCallback(() => onContinue(session), [onContinue, session]);

  return (
    <Pressable
      onPress={handleToggle}
      onLongPress={handleLongPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Card style={{ ...styles.card, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }}>
        <View style={styles.titleRow}>
          <View style={[styles.sessionIcon, { backgroundColor: colors.accentSoft }]}>
            <ChatIcon size={SESSION_ICON_SIZE} color={colors.accent} />
          </View>
          <Typography
            preset="body"
            style={[styles.flex, styles.sessionTitle]}
            numberOfLines={expanded ? undefined : 2}
          >
            {displayTitle}
          </Typography>
          {expanded
            ? <ChevronUpIcon size={CHEVRON_SIZE} color={colors.textSecondary} />
            : <ChevronDownIcon size={CHEVRON_SIZE} color={colors.textSecondary} />}
        </View>

        {session.tags && session.tags.length > 0 && (
          <View style={styles.tagRow}>
            {session.tags.map(tag => (
              <View key={tag} style={[styles.tagPill, { backgroundColor: colors.accentSoft }]}>
                <Typography preset="caption" color={colors.accent}>{tag}</Typography>
              </View>
            ))}
          </View>
        )}

        <View style={styles.metaRow}>
          <Typography preset="caption" color={colors.textDisabled}>
            {session.messageCount} {questionLabel}
          </Typography>
          <View style={[styles.dot, { backgroundColor: colors.textDisabled }]} />
          <View style={[styles.creditPill, { backgroundColor: colors.accentSoft }]}>
            <Typography preset="caption" color={colors.accent}>
              −{session.totalCreditsUsed} {creditLabel}
            </Typography>
          </View>
          <View style={[styles.dot, { backgroundColor: colors.textDisabled }]} />
          <Typography preset="caption" color={colors.textDisabled}>
            {formatDate(session.startedAt)}
          </Typography>
        </View>

        <Pressable
          style={({ pressed }) => [styles.continueRow, { borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={handleContinue}
        >
          <Typography preset="label" color={colors.accent}>{t('ai:chat.continueConversation', 'Continue conversation')}</Typography>
          <ArrowRightIcon size={14} color={colors.accent} />
        </Pressable>

        {expanded && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Divider marginV={spacing.md} />
            {session.messages.map((msg, i) => (
              <MessagePair key={msg.id} chat={msg} index={i} />
            ))}
          </Animated.View>
        )}
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { gap: spacing.sm },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  sessionIcon: {
    width: 26 /* ponytail: off-grid Figma value */, height: 26, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1 /* ponytail: off-grid Figma value */, flexShrink: 0,
  },
  sessionTitle: { fontWeight: fontWeights.medium },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagPill: {
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s2,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  continueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md, marginTop: spacing.xs,
  },
  dot: { width: spacing.s3, height: spacing.s3, borderRadius: radius.r2 },
  creditPill: {
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.s2,
  },

  qRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  aRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  qBadge: {
    width: spacing.s22, height: spacing.s22, borderRadius: radius.r6,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1 /* ponytail: off-grid Figma value */, flexShrink: 0,
  },
  aBadge: {
    width: spacing.s22, height: spacing.s22, borderRadius: radius.r6,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1 /* ponytail: off-grid Figma value */, flexShrink: 0,
  },
  badgeLabel: { fontWeight: fontWeights.bold, fontSize: fontSizes.xs2 },
  flex: { flex: 1 },
  aRowWithMargin: { marginTop: spacing.sm },
  bookmarkDate: { marginTop: spacing.xs },
});
