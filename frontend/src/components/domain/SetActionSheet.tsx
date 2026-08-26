import React from 'react';
import { useTranslation } from 'react-i18next';

import { ActionSheet } from '../feedback';
import type { StudySet } from '../../types';

interface SetActionSheetProps {
  set: StudySet | null;
  visible: boolean;
  onClose: () => void;
  onQuiz: () => void;
  onCreateCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showAssignFolder?: boolean;
  onAssignFolder?: () => void;
  isOwner?: boolean;
}

export function SetActionSheet({
  set,
  visible,
  onClose,
  onQuiz,
  onCreateCard,
  onEdit,
  onDelete,
  showAssignFolder,
  onAssignFolder,
  isOwner = true,
}: SetActionSheetProps) {
  const { t } = useTranslation(['common', 'library']);
  const actions = [
    {
      label: t('library:tabs.study', 'Quiz'),
      iconName: 'help-circle-outline',
      onPress: onQuiz,
    },
    ...(isOwner
      ? [
          {
            label: t('library:cards.addCard', 'Create Card'),
            iconName: 'add-circle-outline',
            onPress: onCreateCard,
          },
        ]
      : []),
    ...(isOwner && showAssignFolder && onAssignFolder
      ? [
          {
            label: t('library:folders.assignFolder', 'Assign Folder'),
            iconName: 'folder-outline',
            onPress: onAssignFolder,
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            label: t('common:actions.edit', 'Edit'),
            iconName: 'pencil-outline',
            onPress: onEdit,
          },
          {
            label: t('common:actions.delete', 'Delete'),
            iconName: 'trash-outline',
            destructive: true as const,
            onPress: onDelete,
          },
        ]
      : []),
  ];

  return (
    <ActionSheet
      visible={visible}
      title={set?.title}
      onClose={onClose}
      actions={actions}
    />
  );
}
