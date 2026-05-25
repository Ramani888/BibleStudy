import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import { GestureDetector, GestureHandlerRootView, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { ProfileScreenProps } from '../../navigation/types';
import type { MediaFile, MediaFileType } from '../../types';
import { useMediaFiles, useUploadMedia, useDeleteMedia, useConfirmDialog } from '../../hooks';
import { Typography } from '../../components/ui/Typography';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { getErrorMessage } from '../../api/client';
import { colors, layout, spacing } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CELL_GAP = 2;
const CELL_SIZE = (SCREEN_WIDTH - CELL_GAP * 2) / 3;
const FAB_SIZE = 56;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Cross-platform pinch-to-zoom + pan image viewer.
// ScrollView's minimumZoomScale/maximumZoomScale/centerContent are iOS-only;
// RNGH + Reanimated gives identical behaviour on both platforms.
function PinchableImage({ url }: { url: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <Image source={{ uri: url }} style={styles.viewerImage} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

type Props = ProfileScreenProps<'Media'>;

export function MediaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MediaFileType>('IMAGE');
  const [viewerImage, setViewerImage] = useState<MediaFile | null>(null);

  const { data: files = [], isLoading, isFetching, error, refetch } = useMediaFiles(activeTab);
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const handlePickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 1 });
      if (result.didCancel || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (!asset.uri || !asset.type || !asset.fileName) {
        Toast.show({ type: 'error', text1: 'Could not read image — try a different photo' });
        return;
      }

      const fd = new FormData();
      fd.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName } as unknown as Blob);

      await uploadMedia.mutateAsync({ formData: fd });
      Toast.show({ type: 'success', text1: 'Image uploaded' });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [uploadMedia]);

  const handlePickPDF = useCallback(async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf],
        copyTo: 'cachesDirectory',
      });
      const uri = result.fileCopyUri ?? result.uri;
      const name = result.name ?? 'document.pdf';
      const type = result.type ?? 'application/pdf';

      const fd = new FormData();
      fd.append('file', { uri, type, name } as unknown as Blob);

      await uploadMedia.mutateAsync({ formData: fd });
      Toast.show({ type: 'success', text1: 'PDF uploaded' });
    } catch (e) {
      if (DocumentPicker.isCancel(e)) return;
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  }, [uploadMedia]);

  const handleDelete = useCallback((file: MediaFile) => {
    showConfirm({
      title: `Delete ${file.type === 'IMAGE' ? 'Image' : 'PDF'}`,
      message: `Delete "${file.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
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

  const renderImageItem = useCallback(({ item }: { item: MediaFile }) => (
    <Pressable
      style={({ pressed }) => [styles.imageCell, pressed && { opacity: 0.8 }]}
      onPress={() => setViewerImage(item)}
      onLongPress={() => handleDelete(item)}
    >
      <Image source={{ uri: item.url }} style={styles.imageThumbnail} resizeMode="cover" />
      <Pressable
        style={styles.imageDeleteBtn}
        onPress={() => handleDelete(item)}
        hitSlop={8}
      >
        <View style={styles.imageDeleteBtnInner}>
          <Icon name="trash-outline" size={13} color="#fff" />
        </View>
      </Pressable>
    </Pressable>
  ), [handleDelete]);

  const renderPDFItem = useCallback(({ item }: { item: MediaFile }) => (
    <Pressable
      style={({ pressed }) => [styles.pdfRow, pressed && styles.pdfRowPressed]}
      onPress={() => navigation.navigate('MediaPDFViewer', { url: item.url, name: item.name })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.pdfIcon}>
        <Icon name="document-text-outline" size={28} color={colors.primary} />
      </View>
      <View style={styles.pdfInfo}>
        <Typography preset="body" numberOfLines={1} style={styles.pdfName}>{item.name}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          {formatFileSize(item.sizeBytes)} · {formatRelativeDate(item.createdAt)}
        </Typography>
      </View>
      <Pressable
        onPress={() => handleDelete(item)}
        hitSlop={8}
        style={styles.pdfDeleteBtn}
      >
        <Icon name="trash-outline" size={18} color={colors.textDisabled} />
      </Pressable>
    </Pressable>
  ), [navigation, handleDelete]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Tab pills */}
      <View style={styles.tabRow}>
        {(['IMAGE', 'PDF'] as const).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Icon
              name={tab === 'IMAGE' ? 'images-outline' : 'document-text-outline'}
              size={16}
              color={activeTab === tab ? colors.primary : colors.textSecondary}
            />
            <Typography
              preset="bodySm"
              color={activeTab === tab ? colors.primary : colors.textSecondary}
              style={activeTab === tab ? styles.tabLabelActive : undefined}
            >
              {tab === 'IMAGE' ? 'Images' : 'PDFs'}
            </Typography>
          </Pressable>
        ))}
      </View>

      <View style={styles.contentArea}>
        {/* Error / Lists */}
        {error ? (
          <View style={styles.list}>
            <ErrorState message="Could not load media" onRetry={refetch} />
          </View>
        ) : activeTab === 'IMAGE' ? (
          <FlatList
            key="image-list"
            data={files}
            keyExtractor={item => item.id}
            renderItem={renderImageItem}
            numColumns={3}
            columnWrapperStyle={styles.imageRow}
            style={styles.list}
            contentContainerStyle={styles.imageList}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              isLoading
                ? <View style={styles.loadingCenter}><ActivityIndicator size="large" color={colors.primary} /></View>
                : <EmptyState title="No images yet" subtitle="Tap + to upload your first photo" />
            }
          />
        ) : (
          <FlatList
            key="pdf-list"
            data={files}
            keyExtractor={item => item.id}
            renderItem={renderPDFItem}
            style={styles.list}
            contentContainerStyle={styles.pdfList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              isLoading
                ? <View style={styles.loadingCenter}><ActivityIndicator size="large" color={colors.primary} /></View>
                : <EmptyState title="No PDFs yet" subtitle="Tap + to upload your first PDF" />
            }
          />
        )}

        {/* FAB — disabled with reduced opacity whenever an upload is in progress */}
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            pressed && styles.fabPressed,
            uploadMedia.isPending && styles.fabDisabled,
          ]}
          onPress={activeTab === 'IMAGE' ? handlePickImage : handlePickPDF}
          disabled={uploadMedia.isPending}
        >
          <Icon name="add" size={28} color={colors.background} />
        </Pressable>

        {/* Upload overlay — scoped to content area, blocks interaction during upload */}
        {uploadMedia.isPending && (
          <Pressable style={styles.uploadOverlay} onPress={() => {}}>
            <View style={styles.uploadSpinner}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          </Pressable>
        )}
      </View>

      {/* Full-screen image viewer — GestureHandlerRootView is required inside Modal
          because Modal renders in a separate native view outside the app's gesture context */}
      <Modal
        visible={viewerImage !== null}
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <GestureHandlerRootView style={styles.viewer}>
          {viewerImage && <PinchableImage url={viewerImage.url} />}
          <Pressable
            style={({ pressed }) => [styles.closeBtn, { top: insets.top + spacing[4] }, pressed && { opacity: 0.7 }]}
            onPress={() => setViewerImage(null)}
            hitSlop={12}
          >
            <Icon name="close" size={28} color={colors.background} />
          </Pressable>
          {viewerImage && (
            <View style={[styles.viewerCaption, { bottom: insets.bottom + spacing[4] }]}>
              <Typography preset="caption" color={colors.background} numberOfLines={1}>
                {viewerImage.name}
              </Typography>
            </View>
          )}
        </GestureHandlerRootView>
      </Modal>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundSecondary },

  tabRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  tabLabelActive: { fontWeight: '600' as const },

  contentArea: { flex: 1 },
  list: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadSpinner: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing[6],
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[16],
  },
  imageList: {
    paddingBottom: FAB_SIZE + spacing[8],
    flexGrow: 1,
  },
  imageRow: { gap: CELL_GAP },
  imageCell: { width: CELL_SIZE, height: CELL_SIZE },
  imageThumbnail: { width: '100%', height: '100%' },
  imageDeleteBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  imageDeleteBtnInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pdfList: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: FAB_SIZE + spacing[8],
    flexGrow: 1,
  },
  separator: { height: spacing[3] },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  pdfRowPressed: { opacity: 0.7 },
  pdfIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfInfo: { flex: 1, gap: spacing[1] },
  pdfName: { fontWeight: '500' as const },
  pdfDeleteBtn: { padding: spacing[1] },

  fab: {
    position: 'absolute',
    bottom: spacing[8],
    right: layout.screenPaddingH,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabPressed: { opacity: 0.85 },
  fabDisabled: { opacity: 0.5 },

  viewer: { flex: 1, backgroundColor: '#000' },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing[4],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCaption: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    alignItems: 'center',
  },
});
