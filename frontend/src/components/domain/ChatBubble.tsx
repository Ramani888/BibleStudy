import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import { Avatar } from '../ui/Avatar';

const AI_BADGE_ICON_SIZE = 14;

type Role = 'user' | 'ai';

interface ChatBubbleProps {
  role: Role;
  text: string;
  creditsUsed?: number;
  userName?: string;
  userImage?: string | null;
}

// Animated dots for the thinking indicator
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
        <Animated.View
          key={i}
          style={[dotStyles.dot, { opacity: dot }]}
        />
      ))}
    </View>
  );
}

export function ChatBubble({ role, text, creditsUsed, userName, userImage }: ChatBubbleProps) {
  const isUser = role === 'user';
  const isTyping = text === '__typing__'; // sentinel set by AIChatScreen.TYPING_INDICATOR

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {/* Avatar — only for AI */}
      {!isUser && (
        <View style={styles.aiBadge}>
          <Icon name="sparkles" size={AI_BADGE_ICON_SIZE} color={colors.textOnPrimary} />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isTyping ? (
          <TypingDots />
        ) : (
          <Typography
            preset="body"
            color={isUser ? colors.textOnPrimary : colors.textPrimary}
            style={styles.text}
          >
            {text}
          </Typography>
        )}
        {isUser && creditsUsed !== undefined && (
          <Typography preset="caption" color={colors.textOnPrimaryMuted} style={styles.credit}>
            −{creditsUsed} credit
          </Typography>
        )}
      </View>

      {/* Avatar — only for user */}
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

  bubble: {
    maxWidth: '78%',
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
