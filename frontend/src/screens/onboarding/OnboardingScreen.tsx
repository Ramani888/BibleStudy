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
import { colors, layout, spacing } from '../../theme';

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
      <View style={styles.iconWrap}>
        <Icon name={item.icon} size={72} color={colors.primary} />
      </View>
      <Spacer size={spacing[8]} />
      <Typography preset="h2" align="center">
        {item.title}
      </Typography>
      <Spacer size={spacing[4]} />
      <Typography preset="body" color={colors.textSecondary} align="center" style={styles.subtitle}>
        {item.subtitle}
      </Typography>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip — top right, hidden on last slide */}
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={markAndComplete} hitSlop={12}>
            <Typography preset="label" color={colors.textSecondary}>
              Skip
            </Typography>
          </Pressable>
        )}
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
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <Spacer size={spacing[6]} />

        {isLast ? (
          <>
            <Button label="Get Started" onPress={markAndComplete} fullWidth />
            <Spacer size={spacing[4]} />
            <Pressable onPress={markAndComplete} hitSlop={8}>
              <Typography preset="bodySm" color={colors.textSecondary} align="center">
                Already have an account?{' '}
                <Typography preset="bodySm" color={colors.primary}>
                  Log in
                </Typography>
              </Typography>
            </Pressable>
          </>
        ) : (
          <Button label="Next" onPress={goNext} fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing[3],
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
    borderRadius: 68,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subtitle: {
    lineHeight: 26,
  },

  bottom: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[8],
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotActive: { width: 24, opacity: 1 },
  dotInactive: { width: 8, opacity: 0.3 },
});
