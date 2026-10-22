import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import {
  useClearHistory,
  useConfirmDialog,
  useDeleteSession,
  useRenameSession,
  useUpdateSessionTags,
} from './index';
import { PencilIcon, TagIcon, TrashIcon } from '../components/icons';
import type { QMSheetAction } from '../components/qm';
import type { ChatSession } from '../types';

export function useChatHistoryActions(
  navigation: { navigate: (screen: string) => void },
  allSessions: ChatSession[],
) {
  const { t } = useTranslation(['common', 'ai']);
  const { mutate: deleteSession, isPending: isDeleting }       = useDeleteSession();
  const { mutate: clearHistory,  isPending: isClearingHistory } = useClearHistory();
  const { mutate: renameSession, isPending: isRenaming }        = useRenameSession();
  const { mutate: updateTags,    isPending: isUpdatingTags }    = useUpdateSessionTags();
  const { show: showConfirm, dialogProps }                      = useConfirmDialog();

  const [sheet, setSheet] = useState<{ visible: boolean; session: ChatSession | null }>({
    visible: false, session: null,
  });
  const [renameModal, setRenameModal] = useState<{ visible: boolean; session: ChatSession | null; value: string }>({
    visible: false, session: null, value: '',
  });
  const [tagsModal, setTagsModal] = useState<{ visible: boolean; session: ChatSession | null; selected: string[] }>({
    visible: false, session: null, selected: [],
  });

  const handleDeleteSession = () => {
    if (!sheet.session?.sessionId) return;
    const sessionId = sheet.session.sessionId;
    showConfirm({
      title: t('ai:qm.history.deleteTitle', 'Delete this conversation?'),
      message: t('ai:qm.history.deleteText', 'It will be removed from your history for good. Cards you saved from it stay in your sets.'),
      confirmLabel: t('common:actions.delete', 'Delete'),
      cancelLabel: t('ai:qm.history.keep', 'Keep'),
      variant: 'danger',
      onConfirm: () => {
        deleteSession(sessionId, {
          onSuccess: () => Toast.show({ type: 'success', text1: t('ai:history.sessionDeleted', 'Conversation deleted') }),
          onError:   () => Toast.show({ type: 'error',   text1: t('common:status.error', 'Oops!') }),
        });
      },
    });
  };

  const handleClearAll = () => {
    if (allSessions.length === 0) return;
    showConfirm({
      title: t('ai:qm.history.clearTitle', 'Clear all history?'),
      message: t('ai:qm.history.clearText', 'Every conversation will be deleted for good. Your flashcards and sets stay as they are.'),
      confirmLabel: t('ai:qm.history.clearAll', 'Clear all'),
      cancelLabel: t('ai:qm.history.keep', 'Keep'),
      variant: 'danger',
      onConfirm: () => {
        clearHistory(undefined, {
          onSuccess: () => Toast.show({ type: 'success', text1: t('ai:history.historyCleared', 'History cleared') }),
          onError:   () => Toast.show({ type: 'error',   text1: t('common:status.error', 'Oops!') }),
        });
      },
    });
  };

  const handleOpenRename = () => {
    if (!sheet.session) return;
    setRenameModal({
      visible: true,
      session: sheet.session,
      value: sheet.session.customTitle || sheet.session.title,
    });
  };

  const handleSaveRename = () => {
    if (!renameModal.session?.sessionId || !renameModal.value.trim()) return;
    renameSession(
      { sessionId: renameModal.session.sessionId, title: renameModal.value.trim() },
      {
        onSuccess: () => {
          setRenameModal({ visible: false, session: null, value: '' });
          Toast.show({ type: 'success', text1: t('ai:history.renamedSuccess', 'Renamed successfully') });
        },
        onError: () => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!') }),
      },
    );
  };

  const handleOpenTags = () => {
    if (!sheet.session) return;
    setTagsModal({ visible: true, session: sheet.session, selected: sheet.session.tags ?? [] });
  };

  const handleToggleTag = (tag: string) => {
    setTagsModal(prev => ({
      ...prev,
      selected: prev.selected.includes(tag)
        ? prev.selected.filter(x => x !== tag)
        : [...prev.selected, tag],
    }));
  };

  const handleSaveTags = () => {
    if (!tagsModal.session?.sessionId) return;
    updateTags(
      { sessionId: tagsModal.session.sessionId, tags: tagsModal.selected },
      {
        onSuccess: () => {
          setTagsModal({ visible: false, session: null, selected: [] });
          Toast.show({ type: 'success', text1: t('ai:history.tagsUpdated', 'Tags updated') });
        },
        onError: () => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!') }),
      },
    );
  };

  const legacy = !sheet.session?.sessionId;
  const sheetActions: QMSheetAction[] = [
    { label: t('common:actions.rename', 'Rename'), icon: PencilIcon, onPress: handleOpenRename, off: legacy },
    { label: t('ai:qm.history.editTopics', 'Edit topics'), icon: TagIcon, onPress: handleOpenTags, off: legacy },
    { label: t('common:actions.delete', 'Delete'), icon: TrashIcon, onPress: handleDeleteSession, danger: true, off: legacy || isDeleting },
  ];

  return {
    sheet, setSheet,
    renameModal, setRenameModal,
    tagsModal, setTagsModal,
    sheetActions, dialogProps,
    isDeleting, isClearingHistory, isRenaming, isUpdatingTags,
    handleClearAll, handleSaveRename, handleToggleTag, handleSaveTags,
  };
}
