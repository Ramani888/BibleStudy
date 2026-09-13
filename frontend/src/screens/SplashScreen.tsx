import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StatusBar, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';
import { VerdanceLogo } from '../components/ui';
import { useSystemBars } from '../hooks';

/** Fixed brand color — splash is identity, not theme-dependent. */
const BRAND_BG = palette.indigo500;
const MIN_VISIBLE_MS = 2000;

interface SplashScreenProps {
  isReady: boolean;
  onFinish: () => void;
}

import { useTranslation } from 'react-i18next';

export function SplashScreen({ isReady, onFinish }: SplashScreenProps) {
  const { t } = useTranslation('common');
  useSystemBars(BRAND_BG);
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
        <VerdanceLogo size={120} />
      </View>
      <Text style={styles.appName}>Verdance</Text>
      <Text style={styles.tagline}>{t('common:brand.tagline', 'Study · Memorize · Grow')}</Text>
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
