import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { palette } from '../theme';

/** Fixed brand color — splash is identity, not theme-dependent. */
const BRAND_BG = palette.indigo500;
const MIN_VISIBLE_MS = 2000;

/** Open Bible with a small cross rising from the spine — white paths on brand bg. */
const LOGO_SVG = `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Cross -->
  <rect x="56" y="4" width="8" height="36" rx="4" fill="white"/>
  <rect x="44" y="12" width="32" height="8" rx="4" fill="white"/>
  <!-- Open book left page -->
  <path d="M8 52 C8 48 12 44 16 44 L56 44 L56 96 C56 96 44 92 28 94 C16 96 8 90 8 84 Z" fill="white" fill-opacity="0.92"/>
  <!-- Open book right page -->
  <path d="M112 52 C112 48 108 44 104 44 L64 44 L64 96 C64 96 76 92 92 94 C104 96 112 90 112 84 Z" fill="white"/>
  <!-- Spine highlight -->
  <rect x="54" y="44" width="12" height="52" rx="2" fill="white" fill-opacity="0.5"/>
  <!-- Left page lines -->
  <rect x="18" y="56" width="28" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="18" y="64" width="22" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="18" y="72" width="26" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="18" y="80" width="20" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <!-- Right page lines -->
  <rect x="74" y="56" width="28" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="74" y="64" width="22" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="74" y="72" width="26" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
  <rect x="74" y="80" width="20" height="3" rx="1.5" fill="#6366F1" fill-opacity="0.4"/>
</svg>`;

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

export function SplashScreen({ isReady, onFinish }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const minElapsedRef = useRef(false);
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  const tryFinish = useCallback(() => {
    if (!minElapsedRef.current || !isReadyRef.current) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start(() => onFinishRef.current());
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
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />
      <View style={styles.logoWrap}>
        <SvgXml xml={LOGO_SVG} width={120} height={120} />
      </View>
      <Text style={styles.appName}>BibleStudy Pro</Text>
      <Text style={styles.tagline}>Study · Memorize · Grow</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    marginBottom: 24,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
  },
  tagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    letterSpacing: 1,
  },
});
