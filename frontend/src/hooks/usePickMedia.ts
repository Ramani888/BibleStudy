import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

import { useUploadMedia } from './useMedia';
import { getErrorMessage } from '../api';
import type { MediaFile } from '../types';

/**
 * Pick a file from the device (photo library / camera / PDF), upload it through the
 * existing media flow, and return the created MediaFile so callers can use it right
 * away (e.g. attach to an AI chat). Uploads count against storage quota like any
 * other media. Returns null on cancel/error (errors are toasted).
 */
type MediaFileWithUri = MediaFile & { localUri: string };

export function usePickMedia() {
  const uploadMedia = useUploadMedia();
  const [pendingLocalUri, setPendingLocalUri] = useState<string | null>(null);

  const upload = useCallback(async (file: { uri: string; type: string; name: string }): Promise<MediaFile | null> => {
    try {
      const fd = new FormData();
      fd.append('file', { uri: file.uri, type: file.type, name: file.name } as unknown as Blob);
      return await uploadMedia.mutateAsync({ formData: fd });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
      return null;
    }
  }, [uploadMedia]);

  const pickImage = useCallback(async (): Promise<MediaFileWithUri | null> => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (result.didCancel) return null;
    if (result.errorCode === 'permission') {
      Toast.show({ type: 'error', text1: 'Photo library permission denied. Enable it in Settings.' });
      return null;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.type || !asset.fileName) {
      if (asset) Toast.show({ type: 'error', text1: 'Could not read image — try another photo' });
      return null;
    }
    setPendingLocalUri(asset.uri);
    const file = await upload({ uri: asset.uri, type: asset.type, name: asset.fileName });
    setPendingLocalUri(null);
    return file ? { ...file, localUri: asset.uri } : null;
  }, [upload]);

  const takePhoto = useCallback(async (): Promise<MediaFileWithUri | null> => {
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel) return null;
    if (result.errorCode === 'permission') {
      Toast.show({ type: 'error', text1: 'Camera permission denied. Enable it in Settings.' });
      return null;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.type || !asset.fileName) {
      if (asset) Toast.show({ type: 'error', text1: 'Could not capture photo' });
      return null;
    }
    setPendingLocalUri(asset.uri);
    const file = await upload({ uri: asset.uri, type: asset.type, name: asset.fileName });
    setPendingLocalUri(null);
    return file ? { ...file, localUri: asset.uri } : null;
  }, [upload]);

  const pickPdf = useCallback(async (): Promise<MediaFile | null> => {
    try {
      const result = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.pdf], copyTo: 'cachesDirectory' });
      return upload({
        uri: result.fileCopyUri ?? result.uri,
        type: result.type ?? 'application/pdf',
        name: result.name ?? 'document.pdf',
      });
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return null;
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
      return null;
    }
  }, [upload]);

  return { pickImage, takePhoto, pickPdf, isUploading: uploadMedia.isPending, pendingLocalUri };
}
