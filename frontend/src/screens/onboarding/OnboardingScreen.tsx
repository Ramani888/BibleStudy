import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button, Spacer, Typography } from '../../components/ui';
import { layout, spacing, fontSizes, lineHeights, useTheme } from '../../theme';
import { useSystemBars } from '../../hooks';
import { storage } from '../../utils/storage';

import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────
interface Slide {
  key: 'welcome' | 'flashcards' | 'ai';
  icon: string;
}

const SLIDE_CONFIGS: Slide[] = [
  { key: 'welcome', icon: 'book-outline' },
  { key: 'flashcards', icon: 'layers-outline' },
  { key: 'ai', icon: 'chatbubble-ellipses-outline' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: Props) {
  const { t } = useTranslation('auth');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const { colors } = useTheme();
  useSystemBars(colors.background);

  const isLast = activeIndex === SLIDE_CONFIGS.length - 1;

  const markAndComplete = useCallback(async () => {
    await storage.setOnboardingSeen(true);
    onComplete();
  }, [onComplete]);

  const goNext = useCallback(() => {
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  }, [activeIndex]);

  const renderSlide = useCallback(({ item }: ListRenderItemInfo<Slide>) => {
    const title = t(`onboarding.slides.${item.key}.title`);
    const subtitle = t(`onboarding.slides.${item.key}.subtitle`);
    return (
      <View style={styles.slide}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name={item.icon} size={72} color={colors.accent} />
        </View>
        <Spacer size={spacing.xxxl} />
        <Typography preset="h2" align="center">
          {title}
        </Typography>
        <Spacer size={spacing.lg} />
        <Typography preset="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
          {subtitle}
        </Typography>
      </View>
    );
  }, [colors, t]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Skip — top right, hidden on last slide */}
      <View>
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={markAndComplete} hitSlop={12} style={({ pressed }) => pressed && styles.skipPressed}>
            <Typography preset="label" color={colors.textSecondary}>
              {t('onboarding.skip')}
            </Typography>
          </Pressable>
        )}
      </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDE_CONFIGS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key}
        renderItem={renderSlide}
        style={styles.list}
      />

      {/* Bottom bar */}
      <View>
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDE_CONFIGS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.accent },
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Spacer size={spacing.xxl} />

        {isLast ? (
          <>
            <Button label={t('onboarding.getStarted')} onPress={markAndComplete} fullWidth />
            <Spacer size={spacing.lg} />
            <Pressable onPress={markAndComplete} hitSlop={8} style={({ pressed }) => pressed && styles.loginPressed}>
              <Typography preset="bodySm" color={colors.textSecondary} align="center">
                {t('alreadyHaveAccount')}{' '}
                <Typography preset="bodySm" color={colors.accent}>
                  {t('signIn')}
                </Typography>
              </Typography>
            </Pressable>
          </>
        ) : (
          <Button label={t('onboarding.next')} onPress={goNext} fullWidth />
        )}
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    minHeight: 44, // ponytail: off-grid hit-target height
  },

  list: { flex: 1 },

  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPaddingH * 1.5,
  },

  iconWrap: {
    width: 136, height: 136, // ponytail: off-grid Figma value
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subtitle: {
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },

  bottom: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing.xxxl,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: spacing.sm,
    borderRadius: layout.pillRadius,
  },
  dotActive: { width: spacing.xxl, opacity: 1 },
  dotInactive: { width: spacing.sm, opacity: 0.3 },
  skipPressed: { opacity: 0.7 },
  loginPressed: { opacity: 0.7 },
});
