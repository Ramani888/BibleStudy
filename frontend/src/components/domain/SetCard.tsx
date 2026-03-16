import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, shadows, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/formatters';
import type { StudySet } from '../../types';

interface SetCardProps {
  set: StudySet;
  onPress: () => void;
  onLongPress?: () => void;
}

export function SetCard({ set, onPress, onLongPress }: SetCardProps) {
  const cardCount = set._count?.cards ?? 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* Top row: title + visibility badge */}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontSize: 16,
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
});
