import React from 'react';

import { ActionSheet } from '../feedback';
import type { StudySet } from '../../types';

interface SetActionSheetProps {
  set: StudySet | null;
  visible: boolean;
  onClose: () => void;
  onStudy: () => void;
  onCreateCard: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showAssignFolder?: boolean;
  onAssignFolder?: () => void;
}

export function SetActionSheet({
  set,
  visible,
  onClose,
  onStudy,
  onCreateCard,
  onEdit,
  onDelete,
  showAssignFolder,
  onAssignFolder,
}: SetActionSheetProps) {
  const actions = [
    {
      label: 'Study Set',
      iconName: 'book-outline',
      onPress: onStudy,
    },
    {
      label: 'Create Card',
      iconName: 'add-circle-outline',
      onPress: onCreateCard,
    },
    ...(showAssignFolder && onAssignFolder
      ? [
          {
            label: 'Assign Folder',
            iconName: 'folder-outline',
            onPress: onAssignFolder,
          },
        ]
      : []),
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
