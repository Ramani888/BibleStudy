import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, fontFamilies, fontSizes, spacing } from '../../theme';
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
        <Animated.View key={i} style={[dotStyles.dot, { opacity: dot }]} />
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
      <Text key={i} style={{ fontWeight: '700', color, fontFamily: fontFamilies.regular }}>
        {seg.slice(2, -2)}
      </Text>
    ) : (
      <Text key={i} style={{ color, fontFamily: fontFamilies.regular }}>
        {seg}
      </Text>
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
                    <Text style={[mdStyles.bulletDot, { color }]}>{isBullet ? '•' : ' '}</Text>
                    <Text style={[mdStyles.bulletText, { color }]}>
                      {renderBold(content, color)}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        return (
          <Text key={bi} style={[mdStyles.para, { color }]}>
            {renderBold(lines.join('\n'), color)}
          </Text>
        );
      })}
    </View>
  );
}

// ── ChatBubble ────────────────────────────────────────────────────────────────

export function ChatBubble({ role, text, creditsUsed, userName, userImage, isTyping = false, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <View style={styles.aiBadge}>
          <Icon name="sparkles" size={AI_BADGE_ICON_SIZE} color={colors.textOnPrimary} />
        </View>
      )}

      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          {isTyping ? (
            <TypingDots />
          ) : isUser ? (
            <Typography preset="body" color={colors.textOnPrimary} style={styles.text}>
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
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  rowUser: { justifyContent: 'flex-end' },
  rowAI: { justifyContent: 'flex-start' },

  bubbleCol: {
    maxWidth: '78%',
    gap: 3,
  },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },

  text: { lineHeight: 22 },
  credit: { marginTop: spacing[0.5] },

  timestamp: { fontSize: 10 },
  timestampUser: { textAlign: 'right' },
  timestampAI: { textAlign: 'left' },

  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: { marginBottom: 2 },
});

const mdStyles = StyleSheet.create({
  root: { gap: spacing[2] },
  para: {
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontFamily: fontFamilies.regular,
  },
  bulletBlock: {},
  bulletRow: { flexDirection: 'row', gap: spacing[2] },
  bulletRowGap: { marginTop: spacing[1] },
  bulletDot: {
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    width: 12,
    fontFamily: fontFamilies.regular,
  },
  bulletText: {
    flex: 1,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontFamily: fontFamilies.regular,
  },
});

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[1],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
});
