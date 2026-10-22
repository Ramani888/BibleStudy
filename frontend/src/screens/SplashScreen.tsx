import React, { useCallback, useEffect, useRef } from 'react';
import { Animated as RNAnimated, StatusBar, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Typography } from '../components/ui';
import { qmLight } from '../theme';
import { useSystemBars } from '../hooks';

/** Brand moment — same in light and dark, and the same colour as the native launch screen. */
const BRAND_BG = qmLight.brand;
const WHITE = qmLight.onViolet;
const MIN_VISIBLE_MS = 2000;
const TILE = 104; // canvas splash logo tile

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

export function SplashScreen({ isReady, onFinish }: SplashScreenProps) {
  const { t } = useTranslation('common');
  useSystemBars(BRAND_BG);
  const opacity = useRef(new RNAnimated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const minElapsedRef = useRef(false);
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  const tryFinish = useCallback(() => {
    if (!minElapsedRef.current || !isReadyRef.current) return;
    RNAnimated.timing(opacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => onFinishRef.current());
  }, [opacity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      minElapsedRef.current = true;
      tryFinish();
    }, MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [tryFinish]);

  useEffect(() => {
    if (isReady) tryFinish();
  }, [isReady, tryFinish]);

  return (
    <RNAnimated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />
      {/* Soft white fog top-left + warm bottom-right, fading in (no glow). */}
      <Animated.View entering={FadeIn.duration(1600)} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="sA" cx="15%" cy="8%" rx="90%" ry="55%">
              <Stop offset="0" stopColor={WHITE} stopOpacity={0.16} />
              <Stop offset="0.65" stopColor={WHITE} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="sB" cx="90%" cy="100%" rx="80%" ry="50%">
              <Stop offset="0" stopColor="#FFC4A0" stopOpacity={0.12} />
              <Stop offset="0.65" stopColor="#FFC4A0" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sA)" />
          <Rect width="100%" height="100%" fill="url(#sB)" />
        </Svg>
      </Animated.View>

      <View style={styles.center}>
        <Animated.View entering={ZoomIn.delay(250).duration(900).springify().damping(12)} style={styles.tile}>
          <Svg width={TILE} height={TILE} viewBox="0 0 44 44">
            <Path d="M15.5 16l6.5 13.65 6.5-13.65" fill="none" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M22 29.65c-2.58-5.33-2.58-10.23 0-15.21 2.58 4.98 2.58 9.88 0 15.21z" fill={WHITE} />
          </Svg>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(700).duration(700)}>
          <Typography preset="qmDisplay" color={WHITE} style={styles.word}>Verdance</Typography>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(900).duration(700)}>
          <Typography preset="qmBody" color="rgba(255,255,255,0.78)" style={styles.tag}>
            {t('common:brand.tagline', 'Study · Memorize · Grow')}
          </Typography>
        </Animated.View>
      </View>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BRAND_BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }, // canvas optical centre
  tile: {
    width: TILE, height: TILE, borderRadius: 32, backgroundColor: BRAND_BG,
    boxShadow: 'inset 0px 0px 0px 1px rgba(255,255,255,0.28), 0px 20px 50px -20px rgba(20,10,60,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  word: { marginTop: 26, fontSize: 38, lineHeight: 44, letterSpacing: 0.2 },
  tag: { marginTop: 8, fontSize: 15, letterSpacing: 0.6 },
});
