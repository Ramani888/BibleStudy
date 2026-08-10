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
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { MediaFile } from '../../types';
import { Typography } from '../../components/ui';
import { CloseIcon, ShareIcon } from '../../components/icons';
import { spacing } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  images: MediaFile[];
  initialIndex: number;
  onClose: () => void;
  onShare: (file: MediaFile) => void;
}

function PinchableImage({ url }: { url: string }) {
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
    });

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (scale.value <= 1) return;
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <Image source={{ uri: url }} style={styles.img} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

export function MediaImageViewer({ visible, images, initialIndex, onClose, onShare }: Props) {
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const onMomentumEnd = useCallback((e: any) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / W));
  }, []);

  const currentFile = images[currentIndex];

  return (
    <Modal visible={visible} statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>

        <FlatList
          ref={flatRef}
          data={images}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.page}>
              <PinchableImage url={item.url} />
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          onMomentumScrollEnd={onMomentumEnd}
        />

        {/* Counter */}
        {images.length > 1 && (
          <View style={[styles.counter, { top: insets.top + spacing[3] }]}>
            <View style={styles.counterPill}>
              <Typography preset="caption" color="#fff">
                {currentIndex + 1} / {images.length}
              </Typography>
            </View>
          </View>
        )}

        {/* Share */}
        {currentFile && (
          <Pressable
            style={[styles.iconBtn, styles.shareBtn, { top: insets.top + spacing[3] }]}
            onPress={() => onShare(currentFile)}
            hitSlop={12}
          >
            <ShareIcon size={20} color="#fff" />
          </Pressable>
        )}

        {/* Close */}
        <Pressable
          style={[styles.iconBtn, styles.closeBtn, { top: insets.top + spacing[3] }]}
          onPress={onClose}
          hitSlop={12}
        >
          <CloseIcon size={22} color="#fff" />
        </Pressable>

        {/* Caption */}
        {currentFile && (
          <View style={[styles.caption, { bottom: insets.bottom + spacing[4] }]}>
            <Typography preset="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>
              {currentFile.name}
            </Typography>
          </View>
        )}

      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  page: { width: W, height: H, justifyContent: 'center' },
  img:  { width: W, height: H },

  counter: {
    position: 'absolute', left: 0, right: 0, alignItems: 'center',
  },
  counterPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
  },

  iconBtn: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtn: { left: spacing[4] },
  closeBtn: { right: spacing[4] },

  caption: {
    position: 'absolute', left: spacing[4], right: spacing[4], alignItems: 'center',
  },
});
