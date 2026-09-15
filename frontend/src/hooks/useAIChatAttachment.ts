import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';
import { AlbumsIcon, CameraIcon, FileTextIcon, StarIcon, StarOutlineIcon } from '../components/icons';
import { useDeleteMedia, useMediaFiles, usePickMedia } from './index';
import { storage } from '../utils/storage';
import type { MediaFile, MediaFileType } from '../types';

const MIN_MEDIA_COST = 3;

export function useAIChatAttachment(creditBalance: number, goPaywall: () => void) {
  const { t } = useTranslation(['ai', 'common']);
  // `ephemeral` marks a file we auto-uploaded just for this attachment (device pick).
  // Those must be deleted if the user clears without sending; files chosen from an
  // existing My Media library must NOT be deleted.
  const [attachment, setAttachment] = useState<{ id: string; name: string; type: MediaFileType; localUri?: string; ephemeral?: boolean } | null>(null);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [pickerVisible, setPickerVisible]         = useState(false);
  const [policyAccepted, setPolicyAccepted]       = useState(false);
  const [policyDialogVisible, setPolicyDialogVisible] = useState(false);

  const { data: media = [] } = useMediaFiles();
  const { pickImage, takePhoto, pickPdf, isUploading, pendingLocalUri } = usePickMedia();
  const { mutate: deleteMedia } = useDeleteMedia();

  useEffect(() => {
    storage.getAiPolicyAccepted().then(accepted => setPolicyAccepted(accepted));
  }, []);

  const attachFromDevice = useCallback(async (pick: () => Promise<(MediaFile & { localUri?: string }) | null>) => {
    if (isUploading) return; // guard rapid double-taps → two pickers/uploads
    const file = await pick();
    if (file) setAttachment({ id: file.id, name: file.name, type: file.type, localUri: file.localUri, ephemeral: true });
  }, [isUploading]);

  const handleAttachPress = useCallback(() => {
    Keyboard.dismiss();
    if (policyAccepted) { setAttachMenuVisible(true); }
    else { setPolicyDialogVisible(true); }
  }, [policyAccepted]);

  const handleClearAttachment = useCallback(() => {
    // Delete the file we auto-uploaded for this attachment so abandoning it doesn't
    // leak storage. Files picked from My Media (ephemeral !== true) are left intact.
    if (attachment?.ephemeral) deleteMedia(attachment.id);
    setAttachment(null);
  }, [attachment, deleteMedia]);

  const acceptPolicy = useCallback(() => {
    storage.setAiPolicyAccepted();
    setPolicyAccepted(true);
    setPolicyDialogVisible(false);
    setAttachMenuVisible(true);
  }, []);

  const attachMenuActions = useMemo(() => creditBalance < MIN_MEDIA_COST
    ? [
        { label: t('ai:attach.mediaCost', 'Media costs 3–5 credits'), icon: StarOutlineIcon, onPress: () => {}, disabled: true },
        { label: t('ai:attach.upgrade', 'Upgrade to Premium'), icon: StarIcon, onPress: goPaywall },
      ]
    : [
        { label: t('ai:attach.chooseMyMedia', 'Choose from My Media'), icon: AlbumsIcon, onPress: () => setPickerVisible(true) },
        { label: t('ai:attach.photoLibrary', 'Photo Library'), icon: AlbumsIcon, onPress: () => attachFromDevice(pickImage) },
        { label: t('ai:attach.takePhoto', 'Take Photo'), icon: CameraIcon, onPress: () => attachFromDevice(takePhoto) },
        { label: t('ai:attach.choosePdf', 'Choose PDF'), icon: FileTextIcon, onPress: () => attachFromDevice(pickPdf) },
      ],
  [t, creditBalance, goPaywall, attachFromDevice, pickImage, takePhoto, pickPdf]);

  const pickerActions = useMemo(() => media.length > 0
    ? media.map(f => ({
        label: f.name,
        icon: f.type === 'PDF' ? FileTextIcon : AlbumsIcon,
        onPress: () => setAttachment({ id: f.id, name: f.name, type: f.type, ephemeral: false }),
      }))
    : [{ label: t('ai:attach.noFiles', 'No files in My Media'), icon: FileTextIcon, onPress: () => {}, disabled: true }],
  [t, media]);

  return {
    attachment, setAttachment,
    attachMenuVisible, setAttachMenuVisible,
    pickerVisible, setPickerVisible,
    policyDialogVisible, setPolicyDialogVisible,
    isUploading, pendingLocalUri,
    attachMenuActions, pickerActions,
    handleAttachPress, handleClearAttachment, acceptPolicy,
  };
}
