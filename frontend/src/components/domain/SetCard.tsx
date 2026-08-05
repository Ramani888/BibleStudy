import React from 'react';
import { AccentIcon, ListCard, Typography } from '../ui';
import { BookIcon } from '../icons';
import { formatDate } from '../../utils/formatters';
import { useTheme } from '../../theme';
import type { StudySet } from '../../types';

interface SetCardProps {
  set: StudySet;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}

export function SetCard({ set, onPress, onLongPress, onMenuPress }: SetCardProps) {
  const { colors } = useTheme();
  const cardCount = set._count?.cards ?? 0;
  const subtitle = `${cardCount} ${cardCount === 1 ? 'card' : 'cards'} · ${formatDate(set.updatedAt)}`;

  return (
    <ListCard
      leading={<AccentIcon icon={BookIcon} color={set.color} />}
      title={set.title}
      meta={
        set.visibility !== 'PRIVATE' ? (
          <Typography preset="caption" color={colors.textSecondary}>
            {set.visibility === 'PUBLIC' ? 'Public' : 'Friends'}
          </Typography>
        ) : undefined
      }
      subtitle={subtitle}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
    />
  );
}
