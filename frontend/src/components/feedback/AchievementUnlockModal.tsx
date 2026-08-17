import React from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { TrophyIcon } from '../icons';
import { Typography } from '../ui/Typography';
import { CelebrationBurst } from '../ui/CelebrationBurst';
import { palette, radius, spacing } from '../../theme';
import type { Achievement } from '../../types';

const BADGE_OUTER = 89;
const BADGE_INNER = 66;

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export function AchievementUnlockModal({ achievement, onDismiss }: AchievementUnlockModalProps) {
  const insets = useSafeAreaInsets();
  if (!achievement) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <CelebrationBurst trigger={achievement.key} />

      <View style={styles.content}>
        <View style={styles.badge}>
          <Svg width={BADGE_OUTER} height={BADGE_OUTER} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient
                id="badgeRing"
                cx={BADGE_OUTER / 2}
                cy={BADGE_OUTER / 2}
                r={BADGE_OUTER / 2}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={palette.indigo500} />
                <Stop offset="1" stopColor="#4B4FFF" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={BADGE_OUTER / 2}
              cy={BADGE_OUTER / 2}
              r={BADGE_OUTER / 2 - 1}
              fill="url(#badgeRing)"
              fillOpacity={0.15}
              stroke={palette.indigo500}
              strokeWidth={1}
            />
            <Circle cx={BADGE_OUTER / 2} cy={BADGE_OUTER / 2} r={BADGE_INNER / 2} fill={palette.indigo500} />
          </Svg>
          <TrophyIcon size={34} color={palette.white} />
        </View>

        <Typography style={styles.eyebrow}>ACHIEVEMENT UNLOCKED</Typography>
        <Typography style={styles.title}>{achievement.title}</Typography>
        <Typography style={styles.desc}>{achievement.description}</Typography>

        {achievement.reward > 0 && (
          <View style={styles.rewardPill}>
            <Typography style={styles.rewardText}>+{achievement.reward} credits</Typography>
          </View>
        )}

        <Pressable onPress={onDismiss} style={styles.continueBtn}>
          <LinearGradient
            colors={[palette.violet500, palette.indigo500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, styles.btnGradient]}
          />
          <Typography style={styles.btnText}>Continue</Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: palette.ink900,
    paddingHorizontal: spacing.xxl,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    width: BADGE_OUTER,
    height: BADGE_OUTER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: palette.indigo500,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 38,
    color: palette.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  rewardPill: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.indigo500,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.indigo300,
  },
  continueBtn: {
    alignSelf: 'stretch',
    marginHorizontal: -8,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
    shadowColor: palette.indigo500,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnGradient: { borderRadius: radius.lg },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.white,
  },
});
