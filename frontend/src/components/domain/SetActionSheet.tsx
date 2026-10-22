import React from 'react';
import { useTranslation } from 'react-i18next';

import { QMSheet, type QMSheetAction } from '../qm';
import { FolderIcon, PencilIcon, PlayIcon, PlusIcon, TrashIcon } from '../icons';
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
  /** Current folder name, shown under "Move to folder". */
  folderName?: string | null;
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
  folderName,
  isOwner = true,
}: SetActionSheetProps) {
  const { t } = useTranslation('library');
  const actions: QMSheetAction[] = [
    { label: t('qm.startQuiz', 'Start a quiz'), icon: PlayIcon, onPress: onQuiz },
    ...(isOwner ? [{ label: t('qm.addCard', 'Add a card'), icon: PlusIcon, onPress: onCreateCard }] : []),
    ...(isOwner && showAssignFolder && onAssignFolder
      ? [{ label: t('qm.moveToFolder', 'Move to folder'), sub: folderName || t('folders.noFolder', 'No folder'), icon: FolderIcon, onPress: onAssignFolder }]
      : []),
    ...(isOwner
      ? [
          { label: t('qm.editSet', 'Edit set'), icon: PencilIcon, onPress: onEdit },
          { label: t('qm.deleteSet', 'Delete set'), icon: TrashIcon, danger: true, onPress: onDelete },
        ]
      : []),
  ];

  return <QMSheet visible={visible} title={set?.title} onClose={onClose} actions={actions} />;
}
