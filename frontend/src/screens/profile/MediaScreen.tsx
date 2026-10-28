import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { MediaFile, MediaFileType } from '../../types';
import { useMediaFiles, useStorageUsage, useTabBarSpace } from '../../hooks';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { useMediaActions } from '../../hooks/useMediaActions';
import { useAuthStore } from '../../store';
import { formatRelativeShort } from '../../utils/formatters';
import { loadFailed } from '../../utils/queryState';
import {
  QMBackButton, QMButton, QMConfirmDialog, QMEmpty, QMInput, QMSearchField, QMSegmented, QMSheet, qmRowEnter, type QMSheetAction,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  CameraIcon, CheckIcon, ChevronRightIcon, ClockIcon, CloseIcon, DocIcon, ImageIcon, InfoIcon, PencilIcon, PlusIcon, SearchIcon,
  ShareUpIcon, SortIcon, TrashIcon, ArrowUpIcon, type IconComponent,
} from '../../components/icons';
import { radius, spacing, useTheme } from '../../theme';
import { MediaImageViewer } from './MediaImageViewer';

type SortOrder = 'newest' | 'oldest' | 'alpha';
const SORT_NEXT: Record<SortOrder, SortOrder> = { newest: 'oldest', oldest: 'alpha', alpha: 'newest' };
const SORT_ICON: Record<SortOrder, IconComponent> = { newest: ClockIcon, oldest: ArrowUpIcon, alpha: SortIcon };

const GRID_GAP = 6;
const COLS = 3;
const TOUCH = 44;
const BAR_H = 8;
const TICK = 24;
const PDF_TILE_W = 44;
const PDF_TILE_H = 54;
const EXPIRY_SOON_DAYS = 7;
const MB = 1048576;

function fmtBytes(n: number): string {
  if (n < MB) return `${Math.round(n / 1024)} KB`;
  const mb = n / MB;
  return mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${+mb.toFixed(1)} MB`;
}

/** Days until a free-plan file is deleted, or null when it never expires. */
function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function Meter({ pct }: { pct: number }) {
  const { qm } = useTheme();
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(pct, { duration: 900, easing: Easing.bezier(0.3, 0.9, 0.3, 1), reduceMotion: ReduceMotion.System });
  }, [w, pct]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  const color = pct >= 90 ? qm.warm : qm.violet;
  return (
    <View style={[styles.bar, { backgroundColor: pct >= 90 ? qm.errorBg : qm.lilac }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, fill]} />
    </View>
  );
}

export function MediaScreen({ navigation }: ProfileScreenProps<'Media'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const cell = (width - spacing.xl * 2 - GRID_GAP * (COLS - 1)) / COLS;

  const plan = useAuthStore(s => s.user?.plan ?? 'FREE');
  const [tab, setTab] = useState<MediaFileType>('IMAGE');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [banner, setBanner] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);

  const filesQuery = useMediaFiles();
  const { data: allFiles = [], isLoading, isFetching, refetch } = filesQuery;
  const isError = loadFailed(filesQuery); // offline with nothing cached → "did not load", not "Photos · 0"
  const { data: storage, refetch: refetchStorage } = useStorageUsage();
  const upload = useMediaUpload();
  const actions = useMediaActions();

  const images = useMemo(() => allFiles.filter(f => f.type === 'IMAGE'), [allFiles]);
  const pdfs = useMemo(() => allFiles.filter(f => f.type === 'PDF'), [allFiles]);
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => {
    const base = (tab === 'IMAGE' ? images : pdfs).filter(f => !q || f.name.toLowerCase().includes(q));
    if (sort === 'oldest') return [...base].reverse();
    if (sort === 'alpha') return [...base].sort((a, b) => a.name.localeCompare(b.name));
    return base;
  }, [tab, images, pdfs, q, sort]);

  const selecting = actions.selectionMode;
  const picked = actions.selectedIds.size;
  const hasAny = allFiles.length > 0;
  const room = storage ? Math.max(0, storage.limit - storage.used) : 0;

  const switchTab = (k: MediaFileType) => { setTab(k); if (selecting) actions.exitSelectionMode(); };

  const openFile = useCallback((f: MediaFile) => {
    if (selecting) { actions.handleToggleSelect(f.id); return; }
    if (f.type === 'PDF') navigation.navigate('MediaPDFViewer', { url: f.url, name: f.name });
    else setViewer(images.findIndex(x => x.id === f.id));
  }, [selecting, actions, navigation, images]);

  const renderPhoto = useCallback(({ item, index }: { item: MediaFile; index: number }) => {
    const on = actions.selectedIds.has(item.id);
    const days = plan === 'FREE' ? daysLeft(item.expiresAt) : null;
    return (
      <Animated.View entering={qmRowEnter(index)}>
        <AnimatedPressable
          scaleTo={0.96}
          onPress={() => openFile(item)}
          onLongPress={() => actions.handleLongPress(item, selecting)}
          style={[styles.cell, { width: cell, height: cell, backgroundColor: qm.field }, on && [styles.cellOn, { borderColor: qm.violet }]]}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          accessibilityState={{ selected: on }}
        >
          <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          {days !== null && days <= EXPIRY_SOON_DAYS && (
            <View style={[styles.expiry, { backgroundColor: qm.goldBg }]}>
              <Typography preset="qmTag" color={qm.goldText}>{days === 0 ? t('profile:qmMedia.today') : t('profile:qmMedia.daysLeft', { count: days })}</Typography>
            </View>
          )}
          {selecting && (
            <View style={[styles.tick, on ? { backgroundColor: qm.violet } : [styles.tickOff, { borderColor: qm.onViolet }]]}>
              {on && <CheckIcon size={14} color={qm.onViolet} strokeWidth={3} />}
            </View>
          )}
        </AnimatedPressable>
      </Animated.View>
    );
  }, [qm, cell, plan, selecting, actions, openFile, t]);

  const renderPdf = useCallback(({ item, index }: { item: MediaFile; index: number }) => {
    const on = actions.selectedIds.has(item.id);
    const days = plan === 'FREE' ? daysLeft(item.expiresAt) : null;
    return (
      <Animated.View entering={qmRowEnter(index)}>
        <AnimatedPressable
          scaleTo={0.98}
          onPress={() => openFile(item)}
          onLongPress={() => actions.handleLongPress(item, selecting)}
          style={[styles.pdfRow, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }, on && [styles.pdfOn, { borderColor: qm.violet }]]}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          accessibilityState={{ selected: on }}
        >
          <View style={[styles.pdfTile, { backgroundColor: qm.errorBg }]}>
            <Typography preset="qmTag" color={qm.warm}>PDF</Typography>
          </View>
          <View style={styles.flex}>
            <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{item.name}</Typography>
            <Typography preset="qmMeta" color={qm.muted} style={styles.sub}>{fmtBytes(item.sizeBytes)} · {formatRelativeShort(item.createdAt)}</Typography>
            {days !== null && days <= EXPIRY_SOON_DAYS && (
              <Typography preset="qmChip" color={qm.goldText} style={styles.sub}>{t('profile:qmMedia.pdfExpiry', { count: days })}</Typography>
            )}
          </View>
          {selecting ? (
            <View style={[styles.tick, on ? { backgroundColor: qm.violet } : [styles.tickOff, { borderColor: qm.off }]]}>
              {on && <CheckIcon size={14} color={qm.onViolet} strokeWidth={3} />}
            </View>
          ) : <ChevronRightIcon size={16} color={qm.muted} strokeWidth={2} />}
        </AnimatedPressable>
      </Animated.View>
    );
  }, [qm, plan, selecting, actions, openFile, t]);

  const SortI = SORT_ICON[sort];
  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <View style={styles.topRow}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmMedia.back')} />
        {(shown.length > 0 || selecting) && (
          <AnimatedPressable
            scaleTo={0.96}
            onPress={() => (selecting ? actions.exitSelectionMode() : actions.setSelectionMode(true))}
            style={[styles.selectBtn, { backgroundColor: selecting ? qm.lilac : qm.field }]}
            accessibilityRole="button"
          >
            <Typography preset="qmLink" color={selecting ? qm.link : qm.body}>{selecting ? t('profile:qmMedia.cancel') : t('profile:qmMedia.select')}</Typography>
          </AnimatedPressable>
        )}
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmMedia.title')}</Typography>

      {storage && (
        <View style={[styles.meter, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <View style={styles.meterHead}>
            <Typography preset="qmBody" color={qm.body}>{t('profile:qmMedia.used', { used: fmtBytes(storage.used), limit: fmtBytes(storage.limit) })}</Typography>
            {plan !== 'PRO' && (
              <Pressable onPress={() => navigation.navigate('Paywall')} hitSlop={8} accessibilityRole="link">
                <Typography preset="qmLink" color={qm.link}>{t('profile:qmMedia.moreRoom')}</Typography>
              </Pressable>
            )}
          </View>
          <Meter pct={Math.min(100, storage.percent)} />
        </View>
      )}

      {plan === 'FREE' && banner && hasAny && (
        <Animated.View entering={FadeIn} style={[styles.banner, { backgroundColor: qm.goldBg }]}>
          <ClockIcon size={18} color={qm.goldText} />
          <Typography preset="qmBody" color={qm.goldText} style={styles.flex}>
            {t('profile:qmMedia.freeBanner')}{' '}
            <Typography preset="qmLink" color={qm.goldText} style={styles.underline} onPress={() => navigation.navigate('Paywall')}>{t('profile:qmMedia.freeBannerLink')}</Typography>
          </Typography>
          <Pressable onPress={() => setBanner(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('profile:qmMedia.dismiss')}>
            <CloseIcon size={16} color={qm.goldText} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}

      {!isError && <View style={styles.tools}>
        <View style={styles.flex}>
          <QMSegmented<MediaFileType>
            label={t('profile:qmMedia.tabs')}
            value={tab}
            onChange={switchTab}
            options={[
              { key: 'IMAGE', label: t('profile:qmMedia.photos', { count: images.length }) },
              { key: 'PDF', label: t('profile:qmMedia.pdfs', { count: pdfs.length }) },
            ]}
          />
        </View>
        <AnimatedPressable scaleTo={0.95} onPress={() => { setSearchOpen(o => !o); setSearch(''); }} style={[styles.touch, { backgroundColor: searchOpen ? qm.lilac : qm.field }]} accessibilityRole="button" accessibilityLabel={t('profile:qmMedia.searchA11y')}>
          <SearchIcon size={18} color={searchOpen ? qm.link : qm.ink} />
        </AnimatedPressable>
        <AnimatedPressable scaleTo={0.95} onPress={() => setSort(s => SORT_NEXT[s])} style={[styles.touch, { backgroundColor: qm.field }]} accessibilityRole="button" accessibilityLabel={t(`profile:qmMedia.sortA11y_${sort}`)}>
          <SortI size={18} color={qm.ink} />
        </AnimatedPressable>
      </View>}
      {searchOpen && <View style={styles.searchWrap}><QMSearchField value={search} onChangeText={setSearch} placeholder={t('profile:qmMedia.search')} autoFocus /></View>}
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmMedia.loadFailed')} action={{ label: t('profile:qmMedia.tryAgain'), onPress: () => refetch() }} />;
  else if (q) empty = <QMEmpty icon={SearchIcon} title={t('profile:qmMedia.noMatch', { query: search.trim() })} text={t('profile:qmMedia.noMatchText')} />;
  else if (tab === 'IMAGE') empty = <QMEmpty icon={ImageIcon} title={t('profile:qmMedia.noPhotos')} text={t('profile:qmMedia.noPhotosText')} />;
  else empty = <QMEmpty icon={DocIcon} title={t('profile:qmMedia.noPdfs')} text={t('profile:qmMedia.noPdfsText')} />;

  const fileActions: QMSheetAction[] = actions.actionSheetFile ? [
    {
      label: t('profile:qmMedia.rename'), icon: PencilIcon,
      onPress: () => {
        const f = actions.actionSheetFile;
        if (f) actions.setRenameState({ visible: true, file: f, value: f.name.replace(/\.[^.]+$/, '') });
      },
    },
    { label: t('profile:qmMedia.share'), icon: ShareUpIcon, onPress: () => { if (actions.actionSheetFile) actions.handleShare(actions.actionSheetFile); } },
    { label: t('profile:qmMedia.delete'), icon: TrashIcon, danger: true, onPress: () => { if (actions.actionSheetFile) actions.handleDelete(actions.actionSheetFile); } },
  ] : [];

  const addActions: QMSheetAction[] = [
    { label: t('profile:qmMedia.takePhoto'), sub: t('profile:qmMedia.upTo'), icon: CameraIcon, onPress: upload.handlePickFromCamera },
    { label: t('profile:qmMedia.fromLibrary'), sub: t('profile:qmMedia.upTo'), icon: ImageIcon, onPress: upload.handlePickImage },
    { label: t('profile:qmMedia.choosePdf'), sub: t('profile:qmMedia.upToPdf'), icon: DocIcon, onPress: upload.handlePickPDF },
  ];

  const ext = actions.renameState.file?.name.match(/\.[^.]+$/)?.[0] ?? '';

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        key={tab}
        data={isError ? [] : shown}
        keyExtractor={item => item.id}
        renderItem={tab === 'IMAGE' ? renderPhoto : renderPdf}
        numColumns={tab === 'IMAGE' ? COLS : 1}
        columnWrapperStyle={tab === 'IMAGE' ? styles.gridRow : undefined}
        extraData={actions.selectedIds}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={shown.length > 0 && !selecting
          ? <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.hint}>{t('profile:qmMedia.hint')}</Typography>
          : null}
        ItemSeparatorComponent={tab === 'PDF' ? Separator : GridSeparator}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { refetch(); refetchStorage(); }}tintColor={qm.violet} progressViewOffset={insets.top} />}
      />

      {upload.uploadMedia.isPending && (
        <Animated.View entering={FadeIn} style={[styles.uploading, { backgroundColor: qm.surface, boxShadow: qm.liftShadow, bottom: spacing.s80 + spacing.sm + tabSpace }]}>
          <View style={styles.uploadHead}>
            <ActivityIndicator size="small" color={qm.violet} />
            <Typography preset="qmFieldLabel" color={qm.ink} numberOfLines={1} style={styles.flex}>{t('profile:qmMedia.uploading', { pct: upload.uploadProgress })}</Typography>
          </View>
          <View style={[styles.upTrack, { backgroundColor: qm.lilac }]}>
            <View style={[styles.upFill, { width: `${upload.uploadProgress}%`, backgroundColor: qm.violet }]} />
          </View>
        </Animated.View>
      )}

      <View style={[styles.footer, { backgroundColor: qm.bg, paddingBottom: spacing.md + tabSpace }]}>
        {selecting ? (
          <QMButton
            icon={TrashIcon}
            label={picked === 0 ? t('profile:qmMedia.pickToDelete') : t('profile:qmMedia.deleteN', { count: picked })}
            off={picked === 0}
            onPress={() => actions.handleBulkDelete(picked)}
          />
        ) : (
          <QMButton
            icon={PlusIcon}
            label={tab === 'IMAGE' ? t('profile:qmMedia.addPhoto') : t('profile:qmMedia.addPdf')}
            loading={upload.uploadMedia.isPending}
            onPress={() => setAddOpen(true)}
          />
        )}
      </View>

      <MediaImageViewer
        visible={viewer !== null}
        images={images}
        initialIndex={viewer ?? 0}
        onClose={() => setViewer(null)}
        onShare={actions.handleShare}
      />

      <QMSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('profile:qmMedia.addTitle')}
        sub={storage ? t('profile:qmMedia.roomLeft', { room: fmtBytes(room) }) : undefined}
        actions={addActions}
      />
      <QMSheet visible={!!actions.actionSheetFile} onClose={() => actions.setActionSheetFile(null)} title={actions.actionSheetFile?.name} actions={fileActions} />
      <QMSheet
        visible={actions.renameState.visible}
        onClose={() => actions.setRenameState({ visible: false, file: null, value: '' })}
        title={t('profile:qmMedia.renameTitle')}
      >
        <View style={styles.renameBody}>
          <QMInput
            value={actions.renameState.value}
            onChangeText={v => actions.setRenameState(st => ({ ...st, value: v }))}
            placeholder={t('profile:qmMedia.fileName')}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={actions.handleRenameConfirm}
            maxLength={255 - ext.length}
            fill={qm.bg}
          />
          <QMButton
            label={t('profile:qmMedia.save')}
            onPress={actions.handleRenameConfirm}
            loading={actions.renameMedia.isPending}
            off={!actions.renameState.value.trim()}
            style={styles.renameBtn}
          />
        </View>
      </QMSheet>
      <QMConfirmDialog {...actions.dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}
function GridSeparator() {
  return <View style={styles.gridSep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  underline: { textDecorationLine: 'underline' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectBtn: { height: 38, paddingHorizontal: spacing.s14, borderRadius: radius.pill, justifyContent: 'center' },
  h1: { marginTop: spacing.s6, marginBottom: spacing.md },
  meter: { padding: spacing.s14, borderRadius: radius.r17 + 1 },
  meterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  bar: { height: BAR_H, borderRadius: BAR_H / 2, marginTop: spacing.s10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: BAR_H / 2 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10, marginTop: spacing.s10, padding: spacing.md, borderRadius: radius.md },
  tools: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.s14 },
  touch: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { marginTop: spacing.s10 },
  listGap: { height: spacing.s14 },
  loading: { marginTop: spacing.xxxl },
  gridRow: { gap: GRID_GAP },
  gridSep: { height: GRID_GAP },
  cell: { borderRadius: radius.r12, overflow: 'hidden' },
  cellOn: { borderWidth: 3 },
  pdfOn: { borderWidth: 2 },
  expiry: { position: 'absolute', left: spacing.xs, bottom: spacing.xs, borderRadius: radius.r6, paddingHorizontal: spacing.s5, paddingVertical: spacing.s2 },
  tick: { position: 'absolute', top: spacing.s6, right: spacing.s6, width: TICK, height: TICK, borderRadius: TICK / 2, alignItems: 'center', justifyContent: 'center' },
  tickOff: { borderWidth: 2 },
  pdfRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r17 + 1 },
  pdfTile: { width: PDF_TILE_W, height: PDF_TILE_H, borderRadius: radius.r10, alignItems: 'center', justifyContent: 'center' },
  sub: { marginTop: spacing.s2 },
  sep: { height: spacing.s10 },
  hint: { marginTop: spacing.lg, marginHorizontal: spacing.s6 },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  uploading: { position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.s80 + spacing.sm, padding: spacing.md, borderRadius: radius.md },
  uploadHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10 },
  upTrack: { height: 4, borderRadius: 2, marginTop: spacing.s10, overflow: 'hidden' },
  upFill: { height: '100%', borderRadius: 2 },
  renameBody: { paddingHorizontal: spacing.s10 },
  renameBtn: { marginTop: spacing.s14 },
});
