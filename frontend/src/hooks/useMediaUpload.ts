import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { useUploadMedia } from './index';
import { getErrorMessage } from '../api/client';

export function useMediaUpload() {
  const uploadMedia = useUploadMedia();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFilename, setUploadFilename] = useState('');
  const [pickSheetVisible, setPickSheetVisible] = useState(false);

  const doUpload = useCallback(async (fd: FormData, name: string) => {
    setUploadFilename(name);
    setUploadProgress(0);
    try {
      await uploadMedia.mutateAsync({ formData: fd, onProgress: setUploadProgress });
      Toast.show({ type: 'success', text1: `${name} uploaded` });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [uploadMedia]);

  const handlePickImage = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
    if (result.didCancel) return;
    if (result.errorCode === 'permission') {
      Toast.show({ type: 'error', text1: 'Photo library permission denied. Enable it in Settings.' });
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.type || !asset.fileName) {
      if (asset) Toast.show({ type: 'error', text1: 'Could not read image — try a different photo' });
      return;
    }
    const fd = new FormData();
    fd.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName } as unknown as Blob);
    await doUpload(fd, asset.fileName);
  }, [doUpload]);

  const handlePickFromCamera = useCallback(async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel) return;
    if (result.errorCode === 'permission') {
      Toast.show({ type: 'error', text1: 'Camera permission denied. Enable it in Settings.' });
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri || !asset.type || !asset.fileName) {
      if (asset) Toast.show({ type: 'error', text1: 'Could not capture photo' });
      return;
    }
    const fd = new FormData();
    fd.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName } as unknown as Blob);
    await doUpload(fd, asset.fileName);
  }, [doUpload]);

  const handlePickPDF = useCallback(async () => {
    try {
      const result = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.pdf], copyTo: 'cachesDirectory' });
      const uri  = result.fileCopyUri ?? result.uri;
      const name = result.name ?? 'document.pdf';
      const type = result.type ?? 'application/pdf';
      const fd = new FormData();
      fd.append('file', { uri, type, name } as unknown as Blob);
      await doUpload(fd, name);
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return;
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [doUpload]);

  return {
    uploadMedia,
    uploadProgress,
    uploadFilename,
    pickSheetVisible, setPickSheetVisible,
    handlePickImage, handlePickFromCamera, handlePickPDF,
  };
}
