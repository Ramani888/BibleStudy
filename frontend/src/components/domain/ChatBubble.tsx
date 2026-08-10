import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { fontSizes, fontWeights, layout, spacing, useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { Avatar } from '../ui/Avatar';

const AI_BADGE_ICON_SIZE = 14;

// Body text metrics matching Typography preset="body"
const BODY_FONT_SIZE = fontSizes.md;   // 15
const BODY_LINE_HEIGHT = BODY_FONT_SIZE * 1.5; // 22.5

type Role = 'user' | 'ai';

interface ChatBubbleProps {
  role: Role;
  text: string;
  creditsUsed?: number;
  userName?: string;
  userImage?: string | null;
  isTyping?: boolean;
  timestamp?: number;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Typing animation ──────────────────────────────────────────────────────────

function TypingDots() {
  const { colors } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ]),
      ),
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={dotStyles.row}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[dotStyles.dot, { opacity: dot, backgroundColor: colors.textSecondary }]} />
      ))}
    </View>
  );
}

// ── Inline bold renderer ──────────────────────────────────────────────────────

function renderBold(text: string, color: string): React.ReactNode {
  const segments = text.split(/(\*\*[^*]+?\*\*)/);
  if (segments.length === 1) return text;
  return segments.map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**') ? (
      <Typography key={i} preset="body" color={color} style={{ fontWeight: fontWeights.bold }}>
        {seg.slice(2, -2)}
      </Typography>
    ) : (
      <Typography key={i} preset="body" color={color}>
        {seg}
      </Typography>
    ),
  );
}

// ── Minimal markdown renderer for AI responses ────────────────────────────────
// Handles: **bold**, - bullet lists, paragraph breaks (blank lines)

function AIMarkdown({ text, color }: { text: string; color: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <View style={mdStyles.root}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return null;

        const hasBullet = lines.some(l => /^[\-*•]\s/.test(l.trim()));

        if (hasBullet) {
          return (
            <View key={bi} style={mdStyles.bulletBlock}>
              {lines.map((line, li) => {
                const t = line.trim();
                const isBullet = /^[\-*•]\s/.test(t);
                const content = isBullet ? t.replace(/^[\-*•]\s+/, '') : t;
                return (
                  <View key={li} style={[mdStyles.bulletRow, li > 0 && mdStyles.bulletRowGap]}>
                    <Typography preset="body" color={color} style={mdStyles.bulletDot}>{isBullet ? '•' : ' '}</Typography>
                    <Typography preset="body" color={color} style={mdStyles.bulletText}>
                      {renderBold(content, color)}
                    </Typography>
                  </View>
                );
              })}
            </View>
          );
        }

        return (
          <Typography key={bi} preset="body" color={color} style={mdStyles.para}>
            {renderBold(lines.join('\n'), color)}
          </Typography>
        );
      })}
    </View>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

export function ChatBubble({ role, text, creditsUsed, userName, userImage, isTyping = false, timestamp }: ChatBubbleProps) {
  const { colors } = useTheme();
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <View style={[styles.aiBadge, { backgroundColor: colors.accent }]}>
          <Icon name="sparkles" size={AI_BADGE_ICON_SIZE} color={colors.textOnAccent} />
        </View>
      )}

      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, isUser ? [styles.bubbleUser, { backgroundColor: colors.accent }] : [styles.bubbleAI, { backgroundColor: colors.background, borderColor: colors.border }]]}>
          {isTyping ? (
            <TypingDots />
          ) : isUser ? (
            <Typography preset="body" color={colors.textOnAccent} style={styles.text}>
              {text}
            </Typography>
          ) : (
            <AIMarkdown text={text} color={colors.textPrimary} />
          )}

          {isUser && creditsUsed !== undefined && (
            <Typography preset="caption" color={colors.textOnPrimaryMuted} style={styles.credit}>
              −{creditsUsed} credit
            </Typography>
          )}
        </View>

        {timestamp !== undefined && !isTyping && (
          <Typography
            preset="caption"
            color={colors.textDisabled}
            style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAI]}
          >
            {formatTime(timestamp)}
          </Typography>
        )}
      </View>

      {isUser && (
        <Avatar uri={userImage} name={userName} size="sm" style={styles.userAvatar} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },

  bubbleCol: {
    maxWidth: '78%',
    gap: spacing.s2,
  },

  bubble: {
    borderRadius: layout.cardRadiusSm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  bubbleUser: {
    borderBottomRightRadius: spacing.xs,
  },
  bubbleAI: {
    borderWidth: 1,
    borderBottomLeftRadius: spacing.xs,
  },

  text: { lineHeight: BODY_LINE_HEIGHT },
  credit: { marginTop: spacing.s2 },

  timestamp: { fontSize: fontSizes.xs2 },
  timestampUser: { textAlign: 'right' },
  timestampAI: { textAlign: 'left' },

  aiBadge: {
    width: layout.avatarSm,
    height: layout.avatarSm,
    borderRadius: layout.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: { marginBottom: spacing.s2 },
});

const mdStyles = StyleSheet.create({
  root: { gap: spacing.sm },
  para: { lineHeight: BODY_LINE_HEIGHT },
  bulletBlock: {},
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletRowGap: { marginTop: spacing.xs },
  bulletDot: { lineHeight: BODY_LINE_HEIGHT, width: 12 },
  bulletText: { flex: 1, lineHeight: BODY_LINE_HEIGHT },
});

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.s6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: spacing.xs,
  },
});
