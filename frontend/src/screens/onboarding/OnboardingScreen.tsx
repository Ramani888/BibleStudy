import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

import { Button, Spacer, Typography } from '../../components/ui';
import { layout, spacing, useTheme } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Slide data ───────────────────────────────────────────────────────────────
interface Slide {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    icon: 'book-outline',
    title: 'Welcome to BibleStudy Pro',
    subtitle:
      'Your Christian learning ecosystem — study Scripture, grow in faith, and connect with your community.',
  },
  {
    key: 'flashcards',
    icon: 'layers-outline',
    title: 'Master Scripture with Flashcards',
    subtitle:
      'Organize your study with Folders, Sets & Cards. Track your progress with spaced repetition.',
  },
  {
    key: 'ai',
    icon: 'chatbubble-ellipses-outline',
    title: 'AI Bible Study Assistant',
    subtitle:
      'Ask Claude AI questions, get verse explanations, and deepen your understanding of Scripture.',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const { colors } = useTheme();

  const isLast = activeIndex === SLIDES.length - 1;

  const markAndComplete = async () => {
    await AsyncStorage.setItem('@onboarding_seen', 'true');
    onComplete();
  };

  const goNext = () => {
    const next = activeIndex + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
  };

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Icon name={item.icon} size={72} color={colors.accent} />
      </View>
      <Spacer size={spacing.xxxl} />
      <Typography preset="h2" align="center">
        {item.title}
      </Typography>
      <Spacer size={spacing.lg} />
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
        {item.subtitle}
      </Typography>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Skip — top right, hidden on last slide */}
      <View>
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={markAndComplete} hitSlop={12}>
            <Typography preset="label" color={colors.textSecondary}>
              Skip
            </Typography>
          </Pressable>
        )}
      </View>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
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
          {SLIDES.map((_, i) => (
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
            <Button label="Get Started" onPress={markAndComplete} fullWidth />
            <Spacer size={spacing.lg} />
            <Pressable onPress={markAndComplete} hitSlop={8}>
              <Typography preset="bodySm" color={colors.textSecondary} align="center">
                Already have an account?{' '}
                <Typography preset="bodySm" color={colors.accent}>
                  Log in
                </Typography>
              </Typography>
            </Pressable>
          </>
        ) : (
          <Button label="Next" onPress={goNext} fullWidth />
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
    minHeight: 44,
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
    width: 136,
    height: 136,
    borderRadius: layout.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subtitle: {
    lineHeight: 26,
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
    height: 8,
    borderRadius: spacing.xs,
  },
  dotActive: { width: 24, opacity: 1 },
  dotInactive: { width: 8, opacity: 0.3 },
});
