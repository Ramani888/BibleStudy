import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, GestureHandlerRootView, Gesture } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { MediaFile } from '../../types';
import { Typography } from '../../components/ui';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ShareUpIcon } from '../../components/icons';
import { palette, spacing } from '../../theme';

const TOUCH = 44;
// ponytail: the viewer is always dark (photos read best on black), so its chrome uses fixed overlay tones, not theme tokens.
const SCRIM_TOP = 'rgba(0,0,0,0.45)';
const SCRIM_BOTTOM = 'rgba(0,0,0,0.5)';
const GLASS_BTN = 'rgba(255,255,255,0.14)';
const SOFT_WHITE = 'rgba(255,255,255,0.7)';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  images: MediaFile[];
  initialIndex: number;
  onClose: () => void;
  onShare: (file: MediaFile) => void;
}

function PinchableImage({ url, onTap, onZoom }: { url: string; onTap: () => void; onZoom: (zoomed: boolean) => void }) {
  // Pan only while zoomed in — an always-on pan swallowed the sideways swipe to the next photo.
  const [zoomed, setZoomed] = useState(false);
  const report = useCallback((z: boolean) => { setZoomed(z); onZoom(z); }, [onZoom]);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate(e => { scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4)); })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        scale.value = withTiming(1); tx.value = withTiming(0); ty.value = withTiming(0);
        savedScale.value = 1; savedTx.value = 0; savedTy.value = 0;
      }
      runOnJS(report)(savedScale.value > 1);
    });

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .onUpdate(e => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  // A single tap shows/hides the bars; it never fires mid-pinch.
  const tap = Gesture.Tap().maxDuration(250).onEnd((_e, ok) => { if (ok) runOnJS(onTap)(); });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, tap)}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <Image source={{ uri: url }} style={styles.img} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

export function MediaImageViewer({ visible, images, initialIndex, onClose, onShare }: Props) {
  const { t } = useTranslation('profile');
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [chrome, setChrome] = useState(true);
  const [zoomed, setZoomed] = useState(false); // a zoomed photo pans instead of paging
  const toggle = useCallback(() => setChrome(c => !c), []);

  const onMomentumEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / W));
  }, []);

  const go = (i: number) => {
    if (i < 0 || i >= images.length) return;
    flatRef.current?.scrollToIndex({ index: i, animated: true });
    setCurrentIndex(i);
  };

  const currentFile = images[currentIndex];

  const renderImageItem = useCallback(({ item }: { item: MediaFile }) => (
    <View style={styles.page}>
      <PinchableImage url={item.url} onTap={toggle} onZoom={setZoomed} />
    </View>
  ), [toggle]);

  return (
    <Modal visible={visible} statusBarTranslucent animationType="fade" onRequestClose={onClose} onShow={() => { setCurrentIndex(initialIndex); setChrome(true); setZoomed(false); }}>
      <GestureHandlerRootView style={styles.root}>
        <FlatList
          ref={flatRef}
          data={images}
          keyExtractor={item => item.id}
          renderItem={renderImageItem}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
          onScrollToIndexFailed={({ index }) => {
            // getItemLayout normally makes this unreachable; recover if layout races.
            requestAnimationFrame(() => flatRef.current?.scrollToIndex({ index, animated: false }));
          }}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
        />

        {chrome && (
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable onPress={onClose} hitSlop={6} style={({ pressed }) => [styles.btn, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('qmViewer.close')}>
              <CloseIcon size={18} color={palette.white} strokeWidth={2} />
            </Pressable>
            <Typography preset="qmSegment" color={palette.white} align="center" style={styles.flex}>
              {images.length > 1 ? t('qmViewer.count', { n: currentIndex + 1, total: images.length }) : ''}
            </Typography>
            {currentFile ? (
              <Pressable onPress={() => onShare(currentFile)} hitSlop={6} style={({ pressed }) => [styles.btn, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={t('qmViewer.share')}>
                <ShareUpIcon size={19} color={palette.white} strokeWidth={2} />
              </Pressable>
            ) : <View style={styles.btnSpacer} />}
          </View>
        )}

        {chrome && currentFile && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Pressable onPress={() => go(currentIndex - 1)} disabled={currentIndex === 0} hitSlop={6} style={({ pressed }) => [styles.btn, (pressed || currentIndex === 0) && styles.dim]} accessibilityRole="button" accessibilityLabel={t('qmViewer.prev')}>
              <ChevronLeftIcon size={18} color={palette.white} strokeWidth={2} />
            </Pressable>
            <View style={styles.flex}>
              <Typography preset="qmSegment" color={palette.white} align="center" numberOfLines={1}>{currentFile.name}</Typography>
              <Typography preset="qmMeta" color={SOFT_WHITE} align="center" style={styles.hint}>{t('qmViewer.hint')}</Typography>
            </View>
            <Pressable onPress={() => go(currentIndex + 1)} disabled={currentIndex >= images.length - 1} hitSlop={6} style={({ pressed }) => [styles.btn, (pressed || currentIndex >= images.length - 1) && styles.dim]} accessibilityRole="button" accessibilityLabel={t('qmViewer.next')}>
              <ChevronRightIcon size={18} color={palette.white} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.black },
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.4 },
  page: { width: W, height: H, justifyContent: 'center' },
  img: { width: W, height: H },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s6,
    paddingHorizontal: spacing.md, paddingBottom: spacing.md, backgroundColor: SCRIM_TOP,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, backgroundColor: SCRIM_BOTTOM,
  },
  btn: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: GLASS_BTN, alignItems: 'center', justifyContent: 'center' },
  btnSpacer: { width: TOUCH },
  hint: { marginTop: spacing.s2 },
});
