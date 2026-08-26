import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';
import Toast from 'react-native-toast-message';
import { useBulkDeleteMedia, useConfirmDialog, useDeleteMedia, useRenameMedia } from './index';
import { getErrorMessage } from '../api/client';
import type { MediaFile } from '../types';

export function useMediaActions() {
  const { t } = useTranslation(['common', 'profile']);
  const deleteMedia     = useDeleteMedia();
  const renameMedia     = useRenameMedia();
  const bulkDeleteMedia = useBulkDeleteMedia();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [actionSheetFile, setActionSheetFile] = useState<MediaFile | null>(null);
  const [renameState, setRenameState] = useState<{ visible: boolean; file: MediaFile | null; value: string }>({
    visible: false, file: null, value: '',
  });

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false); setSelectedIds(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback((size: number) => {
    showConfirm({
      title: t('profile:media.deleteSelectedTitle', 'Delete Selected'),
      message: t('profile:media.deleteSelectedMessage', { count: size, defaultValue: `Delete ${size} file(s)? This cannot be undone.` }),
      confirmLabel: t('common:actions.delete', 'Delete'), variant: 'danger',
      onConfirm: async () => {
        try {
          const results = await bulkDeleteMedia.mutateAsync([...selectedIds]);
          const failed = results.filter(r => r.status === 'rejected').length;
          const ok = results.length - failed;
          Toast.show(failed === 0
            ? { type: 'success', text1: t('profile:media.filesDeleted', { count: ok, defaultValue: `${ok} file(s) deleted` }) }
            : { type: 'error', text1: `${ok} deleted, ${failed} failed` });
          exitSelectionMode();
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [showConfirm, bulkDeleteMedia, selectedIds, exitSelectionMode, t]);

  const handleShare = useCallback(async (file: MediaFile) => {
    try { await Share.share({ message: file.url }); } catch {}
  }, []);

  const handleLongPress = useCallback((file: MediaFile, selMode: boolean) => {
    if (selMode) return;
    setActionSheetFile(file);
  }, []);

  const handleDelete = useCallback((file: MediaFile) => {
    showConfirm({
      title: t('profile:media.deleteFileTitle', { type: file.type === 'IMAGE' ? t('profile:media.image', 'Image') : t('profile:media.pdf', 'PDF'), defaultValue: `Delete ${file.type === 'IMAGE' ? 'Image' : 'PDF'}` }),
      message: t('profile:media.deleteFileMessage', { name: file.name, defaultValue: `Delete "${file.name}"? This cannot be undone.` }),
      confirmLabel: t('common:actions.delete', 'Delete'), variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteMedia.mutateAsync(file.id);
          Toast.show({ type: 'success', text1: t('profile:media.fileDeleted', 'File deleted') });
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [showConfirm, deleteMedia, t]);

  const handleRenameConfirm = useCallback(async () => {
    if (!renameState.file || !renameState.value.trim()) return;
    const ext = renameState.file.name.match(/\.[^.]+$/)?.[0] ?? '';
    const newName = renameState.value.trim() + ext;
    try {
      await renameMedia.mutateAsync({ id: renameState.file.id, name: newName });
      Toast.show({ type: 'success', text1: t('profile:media.fileRenamed', 'File renamed') });
      setRenameState({ visible: false, file: null, value: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [renameMedia, renameState, t]);

  return {
    renameMedia,
    selectionMode, setSelectionMode,
    selectedIds,
    actionSheetFile, setActionSheetFile,
    renameState, setRenameState,
    dialogProps,
    exitSelectionMode, handleToggleSelect,
    handleBulkDelete, handleShare, handleLongPress, handleDelete, handleRenameConfirm,
  };
}
