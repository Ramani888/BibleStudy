import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useCreateFolder, useUpdateFolder } from './useFolders';
import { getErrorMessage } from '../api';
import type { Folder } from '../types';

export function useFolderModal() {
  const { t } = useTranslation(['common', 'library']);
  // ── Create states ──
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // ── Edit states ──
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState<string | null>(null);
  const [editTargetFolder, setEditTargetFolder] = useState<Folder | null>(null);

  // ── Assign folder state ──
  const [assignFolderOpen, setAssignFolderOpen] = useState(false);

  const { mutate: createFolder, isPending: creatingFolder } = useCreateFolder();
  const { mutate: updateFolder, isPending: updatingFolder } = useUpdateFolder();

  // ── Create handlers ──
  const openCreateModal = useCallback(() => {
    setNewFolderModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setNewFolderModalOpen(false);
    setNewFolderName('');
    setSelectedColor(null);
  }, []);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim() || creatingFolder) return;
    createFolder({ name: newFolderName.trim(), color: selectedColor ?? undefined }, {
      onSuccess: () => {
        setNewFolderName('');
        setSelectedColor(null);
        setNewFolderModalOpen(false);
        Toast.show({ type: 'success', text1: t('library:folders.folderCreated', 'Folder created') });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [newFolderName, selectedColor, createFolder, creatingFolder, t]);

  // ── Edit handlers ──
  const openEditModal = useCallback((folder: Folder) => {
    setEditTargetFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
    setEditFolderModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditFolderModalOpen(false);
    setEditFolderName('');
    setEditFolderColor(null);
    setEditTargetFolder(null);
  }, []);

  const handleEditFolder = useCallback(() => {
    if (!editFolderName.trim() || !editTargetFolder || updatingFolder) return;
    updateFolder({ id: editTargetFolder.id, payload: { name: editFolderName.trim(), color: editFolderColor } }, {
      onSuccess: () => {
        closeEditModal();
        Toast.show({ type: 'success', text1: t('library:folders.folderUpdated', 'Folder updated') });
      },
      onError: (err: unknown) => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
    });
  }, [editFolderName, editFolderColor, editTargetFolder, updateFolder, closeEditModal, updatingFolder, t]);

  // ── Assign handlers ──
  const openAssignModal = useCallback(() => {
    setAssignFolderOpen(true);
  }, []);

  const closeAssignModal = useCallback(() => {
    setAssignFolderOpen(false);
  }, []);

  return {
    // Create
    newFolderModalOpen,
    newFolderName,
    setNewFolderName,
    selectedColor,
    setSelectedColor,
    openCreateModal,
    closeCreateModal,
    handleCreateFolder,
    creatingFolder,

    // Edit
    editFolderModalOpen,
    editFolderName,
    setEditFolderName,
    editFolderColor,
    setEditFolderColor,
    openEditModal,
    closeEditModal,
    handleEditFolder,
    updatingFolder,

    // Assign
    assignFolderOpen,
    openAssignModal,
    closeAssignModal,
  };
}
