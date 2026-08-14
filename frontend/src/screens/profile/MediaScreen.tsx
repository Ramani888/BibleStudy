import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ProfileScreenProps } from '../../navigation/types';
import type { MediaFile, MediaFileType, StorageUsage } from '../../types';
import { useMediaFiles, useStorageUsage } from '../../hooks';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useMediaActions } from '../../hooks/useMediaActions';
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
  FileTextIcon, PencilIcon, PlusIcon, ShareIcon,
  SortIcon, TrashIcon, ClockIcon, ArrowUpIcon,
  type IconComponent,
} from '../../components/icons';
import { CARD_FILL_LIGHT, fontSizes, fontWeights, layout, spacing, useTheme, palette } from '../../theme';
import { MediaImageViewer } from './MediaImageViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_GAP  = 3;
const CELL_SIZE = (SCREEN_WIDTH - CELL_GAP * 2) / 3;
const FAB_SIZE  = 56;

type SortOrder = 'newest' | 'oldest' | 'alpha';
const SORT_ICONS: Record<SortOrder, IconComponent> = {
  newest: ClockIcon, oldest: ArrowUpIcon, alpha: SortIcon,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── FadeImage ───────────────────────────────────────────────────────────────

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

// ─── StorageBar ──────────────────────────────────────────────────────────────

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

// ─── UploadToast ─────────────────────────────────────────────────────────────

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Props = ProfileScreenProps<'Media'>;

export function MediaScreen({ navigation }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';

  const [activeTab,    setActiveTab]    = useState<MediaFileType>('IMAGE');
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('newest');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex,  setViewerIndex]  = useState(0);

  const { data: allFiles = [], isLoading, isFetching, error, refetch } = useMediaFiles();
  const { data: storage } = useStorageUsage();

  const upload  = useMediaUpload();
  const actions = useMediaActions();

  const imageFiles  = useMemo(() => allFiles.filter(f => f.type === 'IMAGE'), [allFiles]);
  const pdfFiles    = useMemo(() => allFiles.filter(f => f.type === 'PDF'),   [allFiles]);
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

  const renderImageItem = useCallback(({ item, index }: { item: MediaFile; index: number }) => {
    const isSelected = actions.selectedIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [s.imageCell, pressed && !actions.selectionMode && { opacity: 0.85 }]}
        onPress={() => actions.selectionMode ? actions.handleToggleSelect(item.id) : (setViewerIndex(index), setViewerVisible(true))}
        onLongPress={() => actions.handleLongPress(item, actions.selectionMode)}
      >
        <FadeImage uri={item.url} style={s.imageFill} />
        {isSelected && (
          <View style={[styles.selectionOverlay, { backgroundColor: colors.overlay }]}>
            <CheckCircleIcon size={28} color={palette.white} />
          </View>
        )}
      </Pressable>
    );
  }, [actions, colors.overlay]);

  const renderPDFItem = useCallback(({ item }: { item: MediaFile }) => {
    const isSelected = actions.selectedIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.pdfCard,
          { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
          !isDark && !isSelected && styles.pdfCardShadow,
          pressed && styles.pdfCardPressed,
          isSelected && { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: colors.accentSoft },
        ]}
        onPress={() => actions.selectionMode
          ? actions.handleToggleSelect(item.id)
          : navigation.navigate('MediaPDFViewer', { url: item.url, name: item.name })}
        onLongPress={() => actions.handleLongPress(item, actions.selectionMode)}
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
  }, [actions, navigation, isDark, colors]);

  return (
    <Screen header={<ScreenHeader title="My Media" onBack={() => navigation.goBack()} />}>

      {/* Storage quota bar */}
      {storage && <StorageBar {...storage} />}

      {/* Tab row / Selection header */}
      {actions.selectionMode ? (
        <View style={styles.selectionHeader}>
          <Pressable onPress={actions.exitSelectionMode} hitSlop={8}>
            <Typography preset="caption" color={colors.accent}>Cancel</Typography>
          </Pressable>
          <Typography preset="caption" style={s.selectionCount}>{actions.selectedIds.size} selected</Typography>
          <Pressable onPress={() => actions.handleBulkDelete(actions.selectedIds.size)} disabled={actions.selectedIds.size === 0} hitSlop={8}
            style={actions.selectedIds.size === 0 ? styles.btnDisabled : undefined}>
            <TrashIcon size={20} color={colors.alert} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.tabRow}>
          {(['IMAGE', 'PDF'] as const).map(tab => {
            const count  = tab === 'IMAGE' ? imageFiles.length : pdfFiles.length;
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabPill, { borderColor: colors.border, backgroundColor: colors.background }, active && { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
                onPress={() => setActiveTab(tab)}
              >
                {tab === 'IMAGE'
                  ? <AlbumsIcon  size={15} color={active ? colors.accent : colors.textSecondary} />
                  : <FileTextIcon size={15} color={active ? colors.accent : colors.textSecondary} />
                }
                <Typography preset="caption" color={active ? colors.accent : colors.textSecondary} style={active ? s.tabLabelActive : undefined}>
                  {tab === 'IMAGE' ? 'Images' : 'PDFs'}
                </Typography>
                {!isLoading && count > 0 && (
                  <View style={[styles.badge, active ? { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent } : { backgroundColor: colors.surfaceMuted }]}>
                    <Typography preset="caption" color={active ? colors.accent : colors.textSecondary} style={s.badgeText}>{count}</Typography>
                  </View>
                )}
              </Pressable>
            );
          })}
          <Pressable onPress={cycleSortOrder} style={s.iconBtn} hitSlop={8}>
            <SortIconComp size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => actions.setSelectionMode(true)} style={s.iconBtn} hitSlop={8}>
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
            refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.accent} colors={[colors.accent]} />}
            ListEmptyComponent={<EmptyState title="No images yet" subtitle="Tap + to upload your first photo" />}
          />
        ) : (
          <FlatList
            key="pdfs"
            data={sortedFiles}
            keyExtractor={item => item.id}
            renderItem={renderPDFItem}
            style={s.list}
            contentContainerStyle={s.pdfListContent}
            refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.accent} colors={[colors.accent]} />}
            ListEmptyComponent={<EmptyState title="No PDFs yet" subtitle="Tap + to upload your first PDF" />}
          />
        )}

        {/* FAB */}
        {!actions.selectionMode && (
          <Pressable
            style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent }, pressed && styles.fabPressed, upload.uploadMedia.isPending && styles.fabDisabled]}
            onPress={activeTab === 'IMAGE' ? () => upload.setPickSheetVisible(true) : upload.handlePickPDF}
            disabled={upload.uploadMedia.isPending}
          >
            <PlusIcon size={28} color={colors.textOnAccent} />
          </Pressable>
        )}

        <UploadToast visible={upload.uploadMedia.isPending} progress={upload.uploadProgress} filename={upload.uploadFilename} />
      </View>

      <MediaImageViewer
        visible={viewerVisible}
        images={imageFiles}
        initialIndex={viewerIndex}
        onClose={() => setViewerVisible(false)}
        onShare={actions.handleShare}
      />

      <ActionSheet
        visible={upload.pickSheetVisible}
        title="Add Image"
        actions={[
          { label: 'Photo Library', icon: AlbumsIcon, onPress: upload.handlePickImage },
          { label: 'Take Photo',    icon: CameraIcon, onPress: upload.handlePickFromCamera },
        ]}
        onClose={() => upload.setPickSheetVisible(false)}
      />

      <ActionSheet
        visible={actions.actionSheetFile !== null}
        title={actions.actionSheetFile?.name}
        actions={[
          {
            label: 'Rename', icon: PencilIcon,
            onPress: () => {
              if (!actions.actionSheetFile) return;
              actions.setRenameState({ visible: true, file: actions.actionSheetFile, value: actions.actionSheetFile.name.replace(/\.[^.]+$/, '') });
            },
          },
          { label: 'Share',  icon: ShareIcon, onPress: () => { if (actions.actionSheetFile) actions.handleShare(actions.actionSheetFile); } },
          { label: 'Delete', icon: TrashIcon, destructive: true, onPress: () => { if (actions.actionSheetFile) actions.handleDelete(actions.actionSheetFile); } },
        ]}
        onClose={() => actions.setActionSheetFile(null)}
      />

      <AppModal visible={actions.renameState.visible} title="Rename File" onClose={() => actions.setRenameState({ visible: false, file: null, value: '' })}>
        <TextInput
          value={actions.renameState.value}
          onChangeText={v => actions.setRenameState(st => ({ ...st, value: v }))}
          style={[styles.renameInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceMuted }]}
          autoFocus selectTextOnFocus returnKeyType="done"
          onSubmitEditing={actions.handleRenameConfirm}
          maxLength={255 - (actions.renameState.file?.name.match(/\.[^.]+$/)?.[0]?.length ?? 0)}
          placeholder="File name"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={s.gap3} />
        <Button label="Save" onPress={actions.handleRenameConfirm} loading={actions.renameMedia.isPending} disabled={!actions.renameState.value.trim() || actions.renameMedia.isPending} />
        <View style={s.gap2} />
      </AppModal>

      <ConfirmDialog {...actions.dialogProps} />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    borderRadius: layout.cardRadiusSm, padding: spacing.lg,
  },
  pdfCardShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  pdfCardPressed:  { opacity: 0.7 },
  pdfIconBox: {
    width: 52, height: 52, borderRadius: layout.cardRadiusSm,
    alignItems: 'center', justifyContent: 'center',
  },
  selectionOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
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
    borderWidth: 1, borderRadius: spacing.s10,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: fontSizes.md,
  },
});
