import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { AlbumsIcon, CameraIcon, FileTextIcon, StarIcon, StarOutlineIcon } from '../components/icons';
import { useMediaFiles, usePickMedia } from './index';
import { storage } from '../utils/storage';
import type { MediaFile, MediaFileType } from '../types';

const MIN_MEDIA_COST = 3;

export function useAIChatAttachment(creditBalance: number, goPaywall: () => void) {
  const [attachment, setAttachment] = useState<{ id: string; name: string; type: MediaFileType; localUri?: string } | null>(null);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [pickerVisible, setPickerVisible]         = useState(false);
  const [policyAccepted, setPolicyAccepted]       = useState(false);
  const [policyDialogVisible, setPolicyDialogVisible] = useState(false);

  const { data: media = [] } = useMediaFiles();
  const { pickImage, takePhoto, pickPdf, isUploading, pendingLocalUri } = usePickMedia();

  useEffect(() => {
    storage.getAiPolicyAccepted().then(accepted => setPolicyAccepted(accepted));
  }, []);

  const attachFromDevice = useCallback(async (pick: () => Promise<(MediaFile & { localUri?: string }) | null>) => {
    const file = await pick();
    if (file) setAttachment({ id: file.id, name: file.name, type: file.type, localUri: file.localUri });
  }, []);

  const handleAttachPress = useCallback(() => {
    Keyboard.dismiss();
    if (policyAccepted) { setAttachMenuVisible(true); }
    else { setPolicyDialogVisible(true); }
  }, [policyAccepted]);

  const handleClearAttachment = useCallback(() => setAttachment(null), []);

  const acceptPolicy = useCallback(() => {
    storage.setAiPolicyAccepted();
    setPolicyAccepted(true);
    setPolicyDialogVisible(false);
    setAttachMenuVisible(true);
  }, []);

  const attachMenuActions = useMemo(() => creditBalance < MIN_MEDIA_COST
    ? [
        { label: 'Media costs 3–5 credits', icon: StarOutlineIcon, onPress: () => {}, disabled: true },
        { label: 'Upgrade to Premium', icon: StarIcon, onPress: goPaywall },
      ]
    : [
        { label: 'Choose from My Media', icon: AlbumsIcon, onPress: () => setPickerVisible(true) },
        { label: 'Photo Library', icon: AlbumsIcon, onPress: () => attachFromDevice(pickImage) },
        { label: 'Take Photo', icon: CameraIcon, onPress: () => attachFromDevice(takePhoto) },
        { label: 'Choose PDF', icon: FileTextIcon, onPress: () => attachFromDevice(pickPdf) },
      ],
  [creditBalance, goPaywall, attachFromDevice, pickImage, takePhoto, pickPdf]);

  const pickerActions = useMemo(() => media.length > 0
    ? media.map(f => ({
        label: f.name,
        icon: f.type === 'PDF' ? FileTextIcon : AlbumsIcon,
        onPress: () => setAttachment({ id: f.id, name: f.name, type: f.type }),
      }))
    : [{ label: 'No files in My Media', icon: FileTextIcon, onPress: () => {}, disabled: true }],
  [media]);

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
