import { useCallback, useState } from 'react';
import { Share } from 'react-native';
import Toast from 'react-native-toast-message';
import { useBulkDeleteMedia, useConfirmDialog, useDeleteMedia, useRenameMedia } from './index';
import { getErrorMessage } from '../api/client';
import type { MediaFile } from '../types';

export function useMediaActions() {
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
      title: 'Delete Selected',
      message: `Delete ${size} file(s)? This cannot be undone.`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        try {
          const results = await bulkDeleteMedia.mutateAsync([...selectedIds]);
          const failed = results.filter(r => r.status === 'rejected').length;
          const ok = results.length - failed;
          Toast.show(failed === 0
            ? { type: 'success', text1: `${ok} file${ok !== 1 ? 's' : ''} deleted` }
            : { type: 'error', text1: `${ok} deleted, ${failed} failed` });
          exitSelectionMode();
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [showConfirm, bulkDeleteMedia, selectedIds, exitSelectionMode]);

  const handleShare = useCallback(async (file: MediaFile) => {
    try { await Share.share({ message: file.url }); } catch {}
  }, []);

  const handleLongPress = useCallback((file: MediaFile, selMode: boolean) => {
    if (selMode) return;
    setActionSheetFile(file);
  }, []);

  const handleDelete = useCallback((file: MediaFile) => {
    showConfirm({
      title: `Delete ${file.type === 'IMAGE' ? 'Image' : 'PDF'}`,
      message: `Delete "${file.name}"? This cannot be undone.`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteMedia.mutateAsync(file.id);
          Toast.show({ type: 'success', text1: 'File deleted' });
        } catch (e) {
          Toast.show({ type: 'error', text1: getErrorMessage(e) });
        }
      },
    });
  }, [showConfirm, deleteMedia]);

  const handleRenameConfirm = useCallback(async () => {
    if (!renameState.file || !renameState.value.trim()) return;
    const ext = renameState.file.name.match(/\.[^.]+$/)?.[0] ?? '';
    const newName = renameState.value.trim() + ext;
    try {
      await renameMedia.mutateAsync({ id: renameState.file.id, name: newName });
      Toast.show({ type: 'success', text1: 'File renamed' });
      setRenameState({ visible: false, file: null, value: '' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [renameMedia, renameState]);

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
