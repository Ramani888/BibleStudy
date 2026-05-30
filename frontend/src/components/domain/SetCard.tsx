import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Badge } from '../ui/Badge';
import { Typography } from '../ui/Typography';
import { formatDate } from '../../utils/formatters';
import { colors, fontSizes, spacing } from '../../theme';
import type { StudySet } from '../../types';

const MENU_ICON_SIZE = 20;

interface SetCardProps {
  set: StudySet;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

const DEFAULT_COLOR = colors.gray300;

export function SetCard({ set, onPress, onLongPress, onMenuPress }: SetCardProps) {
  const cardCount = set._count?.cards ?? 0;
  const barColor = set.color ?? DEFAULT_COLOR;

  return (
    <AnimatedPressable
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
    >
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.content}>
        {/* Top row: title + visibility badge + menu */}
        <View style={styles.topRow}>
          <Typography preset="h4" style={styles.title} numberOfLines={1}>
            {set.title}
          </Typography>
          {set.visibility !== 'PRIVATE' && (
            <Badge
              label={set.visibility === 'PUBLIC' ? 'Public' : 'Friends'}
              variant={set.visibility === 'PUBLIC' ? 'info' : 'success'}
            />
          )}
        </View>

        {/* Description */}
        {set.description ? (
          <Typography
            preset="bodySm"
            color={colors.textSecondary}
            numberOfLines={2}
            style={styles.description}
          >
            {set.description}
          </Typography>
        ) : null}

        {/* Bottom row: card count + date */}
        <View style={styles.bottomRow}>
          <View style={styles.countPill}>
            <Typography preset="caption" color={colors.primary}>
              {cardCount} {cardCount === 1 ? 'card' : 'cards'}
            </Typography>
          </View>
          <Typography preset="caption" color={colors.textDisabled}>
            {formatDate(set.updatedAt)}
          </Typography>
        </View>
      </View>
      {onMenuPress && (
        <Pressable onPress={onMenuPress} hitSlop={8} style={styles.menuBtn}>
          <Icon name="ellipsis-vertical" size={MENU_ICON_SIZE} color={colors.textDisabled} />
        </Pressable>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: spacing[4],
    gap: spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: fontSizes.md,
  },
  description: {
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  countPill: {
    backgroundColor: colors.primarySurface,
    borderRadius: 999,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
  },
  menuBtn: {
    paddingHorizontal: spacing[3],
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
