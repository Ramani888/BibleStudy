import React, { useMemo, useState } from 'react';
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
import { useTheme, fontSizes, fontWeights, layout, spacing, type Theme } from '../../../theme';
import { formatDate } from '../../../utils/formatters';
import type { AIChat, BookmarkedChat, ChatSession } from '../../../types';

const BADGE_ICON_SIZE = 12;
const CHEVRON_SIZE = 16;
const SESSION_ICON_SIZE = 14;

function MessagePair({ chat, index }: { chat: AIChat; index: number }) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <>
      {index > 0 && <Divider marginV={spacing[3]} />}
      <View style={styles.qRow}>
        <View style={styles.qBadge}>
          <Typography preset="caption" color={colors.info} style={styles.badgeLabel}>Q</Typography>
        </View>
        <Typography preset="body" style={styles.flex}>{chat.question}</Typography>
      </View>
      <View style={[styles.aRow, { marginTop: spacing[2] }]}>
        <View style={styles.aBadge}>
          <SparklesIcon size={BADGE_ICON_SIZE} color={colors.primary} />
        </View>
        <Typography preset="body" color={colors.textSecondary} style={styles.flex}>
          {chat.answer}
        </Typography>
      </View>
    </>
  );
}

export function BookmarkCard({ chat }: { chat: BookmarkedChat }) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded(e => !e)}>
      <Card style={styles.card}>
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
            <Divider marginV={spacing[3]} />
            <View style={styles.aRow}>
              <View style={styles.aBadge}>
                <SparklesIcon size={BADGE_ICON_SIZE} color={colors.primary} />
              </View>
              <Typography preset="body" color={colors.textSecondary} style={styles.flex}>
                {chat.answer}
              </Typography>
            </View>
          </Animated.View>
        )}
        <Typography preset="caption" color={colors.textDisabled} style={{ marginTop: spacing[1] }}>
          Bookmarked {formatDate(chat.bookmarkedAt)}
        </Typography>
      </Card>
    </Pressable>
  );
}

export interface SessionCardProps {
  session: ChatSession;
  onLongPress: (session: ChatSession) => void;
  onContinue: (session: ChatSession) => void;
}

export function SessionCard({ session, onLongPress, onContinue }: SessionCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);
  const questionLabel = session.messageCount === 1 ? 'question' : 'questions';
  const creditLabel = session.totalCreditsUsed === 1 ? 'credit' : 'credits';
  const displayTitle = session.customTitle || session.title;

  return (
    <Pressable
      onPress={() => setExpanded(e => !e)}
      onLongPress={() => onLongPress(session)}
    >
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.sessionIcon}>
            <ChatIcon size={SESSION_ICON_SIZE} color={colors.primary} />
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
              <View key={tag} style={styles.tagPill}>
                <Typography preset="caption" color={colors.primaryDark}>{tag}</Typography>
              </View>
            ))}
          </View>
        )}

        <View style={styles.metaRow}>
          <Typography preset="caption" color={colors.textDisabled}>
            {session.messageCount} {questionLabel}
          </Typography>
          <View style={styles.dot} />
          <View style={styles.creditPill}>
            <Typography preset="caption" color={colors.primaryDark}>
              −{session.totalCreditsUsed} {creditLabel}
            </Typography>
          </View>
          <View style={styles.dot} />
          <Typography preset="caption" color={colors.textDisabled}>
            {formatDate(session.startedAt)}
          </Typography>
        </View>

        <Pressable
          style={({ pressed }) => [styles.continueRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => onContinue(session)}
        >
          <Typography preset="label" color={colors.primary}>Continue conversation</Typography>
          <ArrowRightIcon size={14} color={colors.primary} />
        </Pressable>

        {expanded && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Divider marginV={spacing[3]} />
            {session.messages.map((msg, i) => (
              <MessagePair key={msg.id} chat={msg} index={i} />
            ))}
          </Animated.View>
        )}
      </Card>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: { gap: spacing[2], backgroundColor: colors.background },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  sessionIcon: {
    width: 26, height: 26, borderRadius: spacing[2],
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  sessionTitle: { fontWeight: fontWeights.medium },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] },
  tagPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  continueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing[3], marginTop: spacing[1],
  },
  dot: { width: 3, height: 3, borderRadius: spacing[0.5], backgroundColor: colors.textDisabled },
  creditPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: layout.pillRadius,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },

  qRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  aRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' },
  qBadge: {
    width: 22, height: 22, borderRadius: spacing[1.5],
    backgroundColor: colors.infoSurface,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  aBadge: {
    width: 22, height: 22, borderRadius: spacing[1.5],
    backgroundColor: colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  badgeLabel: { fontWeight: fontWeights.bold, fontSize: fontSizes.xs2 },
  flex: { flex: 1 },
});
