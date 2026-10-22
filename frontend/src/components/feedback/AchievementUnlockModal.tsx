import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Typography } from '../ui/Typography';
import { AskIcon, CardsIcon, FriendsIcon, LeafIcon, TabQuizIcon, type IconComponent } from '../icons';
import { useReferral } from '../../hooks/useCredits';
import { shareToWhatsApp, buildReferralLink } from '../../utils';
import { requestReviewOnce } from '../../utils/requestReview';
import { radius, spacing, useTheme } from '../../theme';
import type { Achievement, AchievementCategory } from '../../types';

const TILE = 120;
const TILE_RADIUS = 40;
const BTN_H = 52;

/** One drawing per achievement family (canvas Achievements icons). */
export const ACHIEVEMENT_ICON: Record<AchievementCategory, IconComponent> = {
  streak: LeafIcon, study: CardsIcon, quiz: TabQuizIcon, ai: AskIcon, social: FriendsIcon,
};

/** Share an unlocked achievement with the user's invite link (WhatsApp, falls back to the share sheet). */
export function useShareAchievement() {
  const { t } = useTranslation('profile');
  const { data: referral } = useReferral();
  return (a: Achievement) => shareToWhatsApp(
    t('achievements.shareMessage', { title: a.title, url: buildReferralLink(referral?.code), defaultValue: 'I just unlocked "{{title}}" on Verdance 📖✨ Join me: {{url}}' }),
    'achievement',
  );
}

interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

/** Quiet-morning milestone card: the leaf grows in, credits chip, Share / Continue. */
export function AchievementUnlockModal({ achievement: a, onDismiss }: AchievementUnlockModalProps) {
  const { t } = useTranslation('profile');
  const { qm } = useTheme();
  const share = useShareAchievement();
  if (!a) return null;
  const Icon = ACHIEVEMENT_ICON[a.category] ?? LeafIcon;
  const done = () => { onDismiss(); requestReviewOnce('achievement'); };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={done}>
      <Pressable style={[styles.scrim, { backgroundColor: qm.scrim }]} onPress={done} accessibilityLabel={t('qmAch.continue')} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          entering={ZoomIn.duration(600).springify().damping(14)}
          style={[styles.card, { backgroundColor: qm.surface }]}
          accessibilityRole="alert"
          accessibilityLabel={`${t('qmAch.eyebrow')}. ${a.title}`}
        >
          <View style={[styles.tile, { backgroundColor: qm.leafBg }]}>
            <Animated.View entering={ZoomIn.delay(300).duration(1000).easing(Easing.bezier(0.3, 1.6, 0.5, 1))}>
              <Icon size={64} color={qm.leaf} strokeWidth={1.4} />
            </Animated.View>
          </View>
          <Typography preset="qmLabel" color={qm.goldText} align="center" style={styles.eyebrow}>{t('qmAch.eyebrow')}</Typography>
          <Typography preset="qmTitle" color={qm.ink} align="center" style={styles.title}>{a.title}</Typography>
          <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.desc}>{a.description}</Typography>
          {a.reward > 0 && (
            <Animated.View entering={FadeIn.delay(500)} style={[styles.chip, { backgroundColor: qm.leafBg }]}>
              <Typography preset="qmFieldLabel" color={qm.leafText}>{t('qmAch.added', { count: a.reward })}</Typography>
            </Animated.View>
          )}
          <View style={styles.btnRow}>
            <AnimatedPressable scaleTo={0.97} onPress={() => share(a)} style={[styles.btn, { backgroundColor: qm.field }]} accessibilityRole="button">
              <Typography preset="qmButton" color={qm.ink}>{t('qmAch.share')}</Typography>
            </AnimatedPressable>
            <AnimatedPressable scaleTo={0.97} onPress={done} style={[styles.btn, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button">
              <Typography preset="qmButton" color={qm.onViolet}>{t('qmAch.continue')}</Typography>
            </AnimatedPressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  center: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: spacing.xxl },
  card: { borderRadius: radius.lg + 4, paddingTop: spacing.s28, paddingHorizontal: spacing.s22, paddingBottom: spacing.s22, alignItems: 'center' },
  tile: { width: TILE, height: TILE, borderRadius: TILE_RADIUS, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { marginTop: spacing.s18 },
  title: { marginTop: spacing.s6 },
  desc: { marginTop: spacing.xs },
  chip: { marginTop: spacing.s14, borderRadius: radius.pill, paddingVertical: spacing.s7, paddingHorizontal: spacing.s14 },
  btnRow: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.xl, alignSelf: 'stretch' },
  btn: { flex: 1, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
