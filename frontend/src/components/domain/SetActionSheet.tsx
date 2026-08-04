import React from 'react';

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
  const actions = [
    {
      label: 'Quiz',
      iconName: 'help-circle-outline',
      onPress: onQuiz,
    },
    ...(isOwner
      ? [
          {
            label: 'Create Card',
            iconName: 'add-circle-outline',
            onPress: onCreateCard,
          },
        ]
      : []),
    ...(isOwner && showAssignFolder && onAssignFolder
      ? [
          {
            label: 'Assign Folder',
            iconName: 'folder-outline',
            onPress: onAssignFolder,
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            label: 'Edit',
            iconName: 'pencil-outline',
            onPress: onEdit,
          },
          {
            label: 'Delete',
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
