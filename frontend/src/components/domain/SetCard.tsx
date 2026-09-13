import React from 'react';
import { useTranslation } from 'react-i18next';
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
  /** Optional right-side element (e.g. a DUE badge on Home). */
  trailing?: React.ReactNode;
}

export function SetCard({ set, onPress, onLongPress, onMenuPress, trailing }: SetCardProps) {
  const { t } = useTranslation(['library', 'common']);
  const { colors } = useTheme();
  const cardCount = set._count?.cards ?? 0;
  const subtitle = `${t('library:cards.cardCount', { count: cardCount, defaultValue: `${cardCount} cards` })} · ${formatDate(set.updatedAt)}`;

  return (
    <ListCard
      leading={<AccentIcon icon={BookIcon} color={set.color} />}
      title={set.title}
      meta={
        set.visibility !== 'PRIVATE' ? (
          <Typography preset="caption" color={colors.textSecondary}>
            {set.visibility === 'PUBLIC' ? t('library:sets.visibilityPublic', 'Public') : t('library:sets.visibilityFriends', 'Friends')}
          </Typography>
        ) : undefined
      }
      subtitle={subtitle}
      trailing={trailing}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
    />
  );
}
