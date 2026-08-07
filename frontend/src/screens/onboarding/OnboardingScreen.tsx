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

import { BookIcon, LibraryIcon, SparklesIcon } from '../../components/icons';
import { Button, Spacer, Typography } from '../../components/ui';
import { type Theme, useTheme } from '../../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const ICON_WRAP = 136;
const DOT_H = 8;

type IconComponent = React.FC<{ size: number; color: string }>;

interface Slide {
  key: string;
  Icon: IconComponent;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    Icon: BookIcon,
    title: 'Welcome to BibleStudy Pro',
    subtitle:
      'Your Christian learning ecosystem — study Scripture, grow in faith, and connect with your community.',
  },
  {
    key: 'flashcards',
    Icon: LibraryIcon,
    title: 'Master Scripture with Flashcards',
    subtitle:
      'Organize your study with Folders, Sets & Cards. Track your progress with spaced repetition.',
  },
  {
    key: 'ai',
    Icon: SparklesIcon,
    title: 'AI Bible Study Assistant',
    subtitle:
      'Ask Claude AI questions, get verse explanations, and deepen your understanding of Scripture.',
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { colors, spacing } = theme;

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
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
        <item.Icon size={56} color={colors.primary} />
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
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={markAndComplete} hitSlop={12}>
            <Typography preset="label" color={colors.textSecondary}>
              Skip
            </Typography>
          </Pressable>
        )}
      </View>

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

      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: colors.primary },
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    safe:    { flex: 1, backgroundColor: colors.background },
    skipRow: {
      alignItems: 'flex-end',
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      minHeight: 44,
    },
    list:    { flex: 1 },
    slide: {
      width: SCREEN_W,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[6],
    },
    iconWrap: {
      width: ICON_WRAP,
      height: ICON_WRAP,
      borderRadius: ICON_WRAP / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtitle: { lineHeight: 26 },
    bottom: {
      paddingHorizontal: layout.screenPaddingH,
      paddingBottom: spacing[8],
    },
    dotsRow:     { flexDirection: 'row', justifyContent: 'center', gap: spacing[2] },
    dot:         { height: DOT_H, borderRadius: DOT_H / 2 },
    dotActive:   { width: 24, opacity: 1 },
    dotInactive: { width: DOT_H, opacity: 0.3 },
  });
