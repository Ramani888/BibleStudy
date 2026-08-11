import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  TextInput,
  View,
Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { ProfileScreenProps } from '../../navigation/types';
import type { MediaFile, MediaFileType, StorageUsage } from '../../types';
import {
  useMediaFiles, useStorageUsage, useUploadMedia, useDeleteMedia,
  useRenameMedia, useBulkDeleteMedia, useConfirmDialog,
} from '../../hooks';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { ActionSheet } from '../../components/feedback/ActionSheet';
import { AppModal } from '../../components/feedback/Modal';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import {
  AlbumsIcon, CameraIcon, CheckCircleIcon, ChevronRightIcon,
  CloseIcon, FileTextIcon, PencilIcon, PlusIcon, ShareIcon,
  SortIcon, TrashIcon, ClockIcon, ArrowUpIcon,
  type IconComponent,
} from '../../components/icons';
import { getErrorMessage } from '../../api/client';
import { CARD_FILL_LIGHT, fontSizes, fontWeights, layout, spacing, useTheme, palette } from '../../theme';
import { MediaImageViewer } from './MediaImageViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_GAP = 3;
const CELL_SIZE = (SCREEN_WIDTH - CELL_GAP * 2) / 3;
const FAB_SIZE = 56;

type SortOrder = 'newest' | 'oldest' | 'alpha';
const SORT_ICONS: Record<SortOrder, IconComponent> = {
  newest: ClockIcon, oldest: ArrowUpIcon, alpha: SortIcon,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtBytes(n: number): string {
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`;
  const mb = n / 1048576;
  return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

// ─── FadeImage ──────────────────────────────────────────────────────────────

const AnimatedImage = Animated.createAnimatedComponent(Image);

function FadeImage({ uri, style }: { uri: string; style: object }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View style={[style, { backgroundColor: colors.surfaceMuted }]}>
      <AnimatedImage
        source={{ uri }}
        style={[StyleSheet.absoluteFill, animStyle]}
        resizeMode="cover"
        onLoad={() => { opacity.value = withTiming(1, { duration: 250 }); }}
      />
    </View>
  );
}

// ─── StorageBar ─────────────────────────────────────────────────────────────

function StorageBar({ used, limit, percent }: StorageUsage) {
  const { colors } = useTheme();
  const barColor = percent >= 90 ? colors.alert : percent >= 70 ? colors.warning : colors.accent;
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withTiming(percent / 100, { duration: 700 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${anim.value * 100}%` as `${number}%`,
    backgroundColor: barColor,
  }));
  return (
    <View style={sbStyles.wrap}>
      <View style={[sbStyles.track, { backgroundColor: colors.surfaceMuted }]}>
        <Animated.View style={[sbStyles.fill, barStyle]} />
      </View>
      <Typography preset="caption" color={colors.textSecondary}>
        {fmtBytes(used)} of {fmtBytes(limit)} used · {percent}%
      </Typography>
    </View>
  );
}

const sbStyles = StyleSheet.create({
  wrap:  { paddingHorizontal: layout.screenPaddingH, paddingBottom: spacing.md, gap: spacing.s6 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 2 },
});

// ─── UploadToast ────────────────────────────────────────────────────────────

function UploadToast({ visible, progress, filename }: { visible: boolean; progress: number; filename: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);
  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 100, { duration: 220 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return (
    <Animated.View style={[
      utStyles.container,
      { backgroundColor: colors.background, borderColor: colors.border, bottom: insets.bottom + spacing.sm },
      animStyle,
    ]}>
      <ActivityIndicator size="small" color={colors.accent} />
      <View style={utStyles.info}>
        <Typography preset="caption" numberOfLines={1} color={colors.textPrimary}>
          {filename ? `Uploading ${filename}` : 'Uploading…'}
        </Typography>
        <View style={[utStyles.track, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[utStyles.bar, { width: `${progress}%`, backgroundColor: colors.accent }]} />
        </View>
      </View>
      <Typography preset="caption" color={colors.accent} style={utStyles.pct}>
        {progress}%
      </Typography>
    </Animated.View>
  );
}

const utStyles = StyleSheet.create({
  container: {
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 4 }, default: {} }),
  },
  info:  { flex: 1, gap: spacing.xs },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  bar:   { height: '100%', borderRadius: 2 },
  pct:   { minWidth: 32, textAlign: 'right', fontWeight: fontWeights.semiBold },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Props = ProfileScreenProps<'Media'>;

export function MediaScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab]         = useState<MediaFileType>('IMAGE');
  const [sortOrder, setSortOrder]         = useState<SortOrder>('newest');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex]     = useState(0);
  const [pickSheetVisible, setPickSheetVisible]   = useState(false);
  const [actionSheetFile, setActionSheetFile]     = useState<MediaFile | null>(null);
  const [uploadProgress, setUploadProgress]       = useState(0);
  const [uploadFilename, setUploadFilename]       = useState('');
  const [renameState, setRenameState] = useState<{ visible: boolean; file: MediaFile | null; value: string }>({
    visible: false, file: null, value: '',
  });

  const { data: allFiles = [], isLoading, isFetching, error, refetch } = useMediaFiles();
  const { data: storage } = useStorageUsage();
  const uploadMedia    = useUploadMedia();
  const deleteMedia    = useDeleteMedia();
  const renameMedia    = useRenameMedia();
  const bulkDeleteMedia = useBulkDeleteMedia();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const imageFiles = useMemo(() => allFiles.filter(f => f.type === 'IMAGE'), [allFiles]);
  const pdfFiles   = useMemo(() => allFiles.filter(f => f.type === 'PDF'),   [allFiles]);
  const activeFiles = activeTab === 'IMAGE' ? imageFiles : pdfFiles;

  const sortedFiles = useMemo(() => {
    if (sortOrder === 'newest') return activeFiles;
    const arr = [...activeFiles];
    if (sortOrder === 'oldest') return arr.reverse();
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFiles, sortOrder]);

  const SortIconComp = SORT_ICONS[sortOrder];
  const cycleSortOrder = useCallback(() =>
    setSortOrder(s => s === 'newest' ? 'oldest' : s === 'oldest' ? 'alpha' : 'newest'), []);

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

  const handleBulkDelete = useCallback(() => {
    showConfirm({
      title: 'Delete Selected',
      message: `Delete ${selectedIds.size} file(s)? This cannot be undone.`,
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

  const handleLongPress = useCallback((file: MediaFile) => {
    if (selectionMode) return;
    setActionSheetFile(file);
  }, [selectionMode]);

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

  const renderImageItem = useCallback(({ item, index }: { item: MediaFile; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [s.imageCell, pressed && !selectionMode && { opacity: 0.85 }]}
        onPress={() => selectionMode ? handleToggleSelect(item.id) : (setViewerIndex(index), setViewerVisible(true))}
        onLongPress={() => handleLongPress(item)}
      >
        <FadeImage uri={item.url} style={s.imageFill} />
        {isSelected && (
          <View style={[styles.selectionOverlay, { backgroundColor: colors.overlay }]}>
            <CheckCircleIcon size={28} color={palette.white} />
          </View>
        )}
      </Pressable>
    );
  }, [selectedIds, selectionMode, handleToggleSelect, handleLongPress, colors.overlay]);

  const renderPDFItem = useCallback(({ item }: { item: MediaFile }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.pdfCard,
          { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
          !isDark && !isSelected && styles.pdfCardShadow,
          pressed && styles.pdfCardPressed,
          isSelected && { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: colors.accentSoft },
        ]}
        onPress={() => selectionMode
          ? handleToggleSelect(item.id)
          : navigation.navigate('MediaPDFViewer', { url: item.url, name: item.name })}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={[styles.pdfIconBox, { backgroundColor: colors.accentSoft }]}>
          <FileTextIcon size={26} color={colors.accent} />
        </View>
        <View style={s.pdfInfo}>
          <Typography preset="label" numberOfLines={1} style={s.pdfName}>{item.name}</Typography>
          <Typography preset="caption" color={colors.textSecondary}>
            {fmtBytes(item.sizeBytes)} · {fmtDate(item.createdAt)}
          </Typography>
        </View>
        {isSelected
          ? <CheckCircleIcon size={22} color={colors.accent} />
          : <ChevronRightIcon size={18} color={colors.textDisabled} />
        }
      </Pressable>
    );
  }, [selectedIds, selectionMode, handleToggleSelect, navigation, handleLongPress, colors]);

  return (
    <Screen header={<ScreenHeader title="My Media" onBack={() => navigation.goBack()} />}>

      {/* Storage quota bar */}
      {storage && <StorageBar {...storage} />}

      {/* Tab row / Selection header */}
      {selectionMode ? (
        <View style={styles.selectionHeader}>
          <Pressable onPress={exitSelectionMode} hitSlop={8}>
            <Typography preset="caption" color={colors.accent}>Cancel</Typography>
          </Pressable>
          <Typography preset="caption" style={s.selectionCount}>
            {selectedIds.size} selected
          </Typography>
          <Pressable onPress={handleBulkDelete} disabled={selectedIds.size === 0} hitSlop={8}
            style={selectedIds.size === 0 ? styles.btnDisabled : undefined}>
            <TrashIcon size={20} color={colors.alert} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.tabRow}>
          {(['IMAGE', 'PDF'] as const).map(tab => {
            const count = tab === 'IMAGE' ? imageFiles.length : pdfFiles.length;
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.tabPill,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                {tab === 'IMAGE'
                  ? <AlbumsIcon size={15} color={active ? colors.accent : colors.textSecondary} />
                  : <FileTextIcon size={15} color={active ? colors.accent : colors.textSecondary} />
                }
                <Typography preset="caption" color={active ? colors.accent : colors.textSecondary}
                  style={active ? s.tabLabelActive : undefined}>
                  {tab === 'IMAGE' ? 'Images' : 'PDFs'}
                </Typography>
                {!isLoading && count > 0 && (
                  <View style={[
                    styles.badge,
                    active
                      ? { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent }
                      : { backgroundColor: colors.surfaceMuted },
                  ]}>
                    <Typography preset="caption" color={active ? colors.accent : colors.textSecondary}
                      style={s.badgeText}>
                      {count}
                    </Typography>
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable onPress={cycleSortOrder} style={s.iconBtn} hitSlop={8}>
            <SortIconComp size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => setSelectionMode(true)} style={s.iconBtn} hitSlop={8}>
            <CheckCircleIcon size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Content */}
      <View style={s.contentArea}>
        {error ? (
          <ErrorState message="Could not load media" onRetry={refetch} />
        ) : activeTab === 'IMAGE' ? (
          <FlatList
              key="images"
              data={sortedFiles}
              keyExtractor={item => item.id}
              renderItem={renderImageItem}
              numColumns={3}
              columnWrapperStyle={s.imageRow}
              style={s.list}
              contentContainerStyle={s.imageListContent}
              refreshControl={
                <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch}
                  tintColor={colors.accent} colors={[colors.accent]} />
              }
              ListEmptyComponent={
                <EmptyState title="No images yet" subtitle="Tap + to upload your first photo" />
              }
            />
        ) : (
          <FlatList
              key="pdfs"
              data={sortedFiles}
              keyExtractor={item => item.id}
              renderItem={renderPDFItem}
              style={s.list}
              contentContainerStyle={s.pdfListContent}
              refreshControl={
                <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch}
                  tintColor={colors.accent} colors={[colors.accent]} />
              }
              ListEmptyComponent={
                <EmptyState title="No PDFs yet" subtitle="Tap + to upload your first PDF" />
              }
            />
        )}

        {/* FAB */}
        {!selectionMode && (
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.accent },
              pressed && styles.fabPressed,
              uploadMedia.isPending && styles.fabDisabled,
            ]}
            onPress={activeTab === 'IMAGE' ? () => setPickSheetVisible(true) : handlePickPDF}
            disabled={uploadMedia.isPending}
          >
            <PlusIcon size={28} color={colors.textOnAccent} />
          </Pressable>
        )}

        {/* Non-blocking upload toast */}
        <UploadToast
          visible={uploadMedia.isPending}
          progress={uploadProgress}
          filename={uploadFilename}
        />
      </View>

      {/* Swipeable image viewer */}
      <MediaImageViewer
        visible={viewerVisible}
        images={imageFiles}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
        onShare={handleShare}
      />

      <ActionSheet
        visible={pickSheetVisible}
        title="Add Image"
        actions={[
          { label: 'Photo Library', icon: AlbumsIcon, onPress: handlePickImage },
          { label: 'Take Photo',    icon: CameraIcon, onPress: handlePickFromCamera },
        ]}
        onClose={() => setPickSheetVisible(false)}
      />

      <ActionSheet
        visible={actionSheetFile !== null}
        title={actionSheetFile?.name}
        actions={[
          {
            label: 'Rename', icon: PencilIcon,
            onPress: () => {
              if (!actionSheetFile) return;
              setRenameState({ visible: true, file: actionSheetFile, value: actionSheetFile.name.replace(/\.[^.]+$/, '') });
            },
          },
          { label: 'Share', icon: ShareIcon, onPress: () => { if (actionSheetFile) handleShare(actionSheetFile); } },
          { label: 'Delete', icon: TrashIcon, destructive: true, onPress: () => { if (actionSheetFile) handleDelete(actionSheetFile); } },
        ]}
        onClose={() => setActionSheetFile(null)}
      />

      <AppModal
        visible={renameState.visible}
        title="Rename File"
        onClose={() => setRenameState({ visible: false, file: null, value: '' })}
      >
        <TextInput
          value={renameState.value}
          onChangeText={v => setRenameState(st => ({ ...st, value: v }))}
          style={[styles.renameInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          autoFocus selectTextOnFocus returnKeyType="done"
          onSubmitEditing={handleRenameConfirm}
          maxLength={255 - (renameState.file?.name.match(/\.[^.]+$/)?.[0]?.length ?? 0)}
          placeholder="File name"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={s.gap3} />
        <Button label="Save" onPress={handleRenameConfirm}
          loading={renameMedia.isPending}
          disabled={!renameState.value.trim() || renameMedia.isPending} />
        <View style={s.gap2} />
      </AppModal>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

// ─── Static styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  contentArea:      { flex: 1 },
  list:             { flex: 1 },
  imageListContent: { paddingBottom: FAB_SIZE + spacing.s48, flexGrow: 1, paddingTop: CELL_GAP },
  imageRow:         { gap: CELL_GAP },
  imageCell:        { width: CELL_SIZE, height: CELL_SIZE },
  imageFill:        { width: '100%', height: '100%' },
  pdfListContent:   { paddingHorizontal: layout.screenPaddingH, paddingBottom: FAB_SIZE + spacing.s48, flexGrow: 1, gap: spacing.lg },
  pdfInfo:          { flex: 1, gap: spacing.s2 },
  pdfName:          { fontWeight: fontWeights.medium },
  selectionCount:   { fontWeight: fontWeights.semiBold },
  tabLabelActive:   { fontWeight: fontWeights.semiBold },
  badgeText:        { fontSize: 10, fontWeight: fontWeights.semiBold },
  iconBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  gap3:             { height: spacing.md },
  gap2:             { height: spacing.sm },
});

const styles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: layout.screenPaddingH, marginVertical: spacing.md, height: 40,
  },
  tabRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: layout.screenPaddingH, marginBottom: spacing.md,
  },
  tabPill: {
    flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.s6, paddingVertical: spacing.s10,
    borderRadius: spacing.s10, borderWidth: 1,
  },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: spacing.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  pdfCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: layout.cardRadiusSm,
    padding: spacing.lg,
  },
  pdfCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  pdfCardPressed:  { opacity: 0.7 },
  pdfIconBox: {
    width: 52, height: 52, borderRadius: layout.cardRadiusSm,
    alignItems: 'center', justifyContent: 'center',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  fab: {
    position: 'absolute', bottom: spacing.xxxl, right: layout.screenPaddingH,
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 8 }, default: {} }),
  },
  fabPressed:  { opacity: 0.85 },
  fabDisabled: { opacity: 0.5 },
  btnDisabled: { opacity: 0.4 },
  renameInput: {
    borderWidth: 1,
    borderRadius: spacing.s10,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: fontSizes.md,
  },
});
