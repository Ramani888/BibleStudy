import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInRight, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Typography } from '../../components/ui';
import { QMButton, QMFog } from '../../components/qm';
import { useTheme, spacing, radius } from '../../theme';
import { useSystemBars } from '../../hooks';
import { storage } from '../../utils/storage';

const SLIDES = ['welcome', 'flashcards', 'ai'] as const;
const STAGE_H = 330; // canvas illustration stage

export type OnboardingExit = 'Login' | 'Register';

/** Gentle 6px bob, 5s loop; still under Reduce Motion. */
function Float({ children, style }: { children: React.ReactNode; style?: object }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!reduce) y.value = withRepeat(withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

// ─── Scenes ───────────────────────────────────────────────────────────────────
function VerseScene() {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  return (
    <View style={styles.stageCenter}>
      <View style={[styles.backCard, { backgroundColor: qm.surface, boxShadow: qm.liftShadow }]}>
        <Typography preset="qmCardTitle" color={qm.muted}>{t('onboarding.scene.backCard')}</Typography>
      </View>
      <Float style={styles.verseTilt}>
        <LinearGradient colors={qm.verse as unknown as string[]} locations={[0, 0.6, 1]} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={[styles.verseCard, { boxShadow: qm.liftShadow }]}>
          <Typography preset="qmLabel" color={qm.verseRef} style={styles.verseRef}>{t('onboarding.scene.verseRef')}</Typography>
          <Typography preset="qmVerse" color={qm.verseInk} style={styles.verseText}>{t('onboarding.scene.verseText')}</Typography>
        </LinearGradient>
      </Float>
    </View>
  );
}

function Chip({ label, icon }: { label: string; icon?: boolean }) {
  const { qm } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: qm.surface, boxShadow: qm.liftShadow }]}>
      {icon && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" stroke={qm.link} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      <Typography preset="qmLabel" color={qm.ink}>{label}</Typography>
    </View>
  );
}

function BuildScene() {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  return (
    <View style={[styles.stageCenter, styles.buildGap]}>
      <View style={styles.chipRow}>
        <Chip label={t('onboarding.scene.chipPsalm')} />
        <Chip label={t('onboarding.scene.chipGrace')} />
        <Chip label={t('onboarding.scene.chipPdf')} icon />
      </View>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M6 13l6 6 6-6" stroke={qm.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={styles.fan}>
        <View style={[styles.fanCard, styles.fanLeft, { backgroundColor: qm.fan1, boxShadow: qm.liftShadow }]} />
        <View style={[styles.fanCard, styles.fanRight, { backgroundColor: qm.fan3, boxShadow: qm.liftShadow }]} />
        <Float style={StyleSheet.absoluteFill}>
          <View style={[styles.fanCard, styles.fanFront, { backgroundColor: qm.surface, boxShadow: qm.liftShadow }]}>
            <Typography preset="qmTag" color={qm.link}>{t('onboarding.scene.flashcard')}</Typography>
            <Typography preset="qmCardTitle" color={qm.ink} style={styles.fanText}>{t('onboarding.scene.flashcardText')}</Typography>
          </View>
        </Float>
      </View>
    </View>
  );
}

function AskScene() {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  return (
    <View style={styles.askStage}>
      <View style={[styles.userBubble, { backgroundColor: qm.violet }]}>
        <Typography preset="qmBody" color={qm.onViolet}>{t('onboarding.scene.askUser')}</Typography>
      </View>
      <Float style={styles.aiWrap}>
        {/* calm solid violet outline while the AI "works" — no glow (v70) */}
        <View style={[styles.aiOutline, { backgroundColor: qm.violet }]}>
          <View style={[styles.aiBubble, { backgroundColor: qm.surface }]}>
            <Typography preset="qmBody" color={qm.ink}>{t('onboarding.scene.askAi')}</Typography>
          </View>
        </View>
      </Float>
      <View style={styles.pillRow}>
        {[t('onboarding.scene.chipVerse'), t('onboarding.scene.chipQuiz')].map(l => (
          <View key={l} style={[styles.pill, { backgroundColor: qm.lilac }]}>
            <Typography preset="qmCaption" color={qm.lilacInk}>{l}</Typography>
          </View>
        ))}
      </View>
    </View>
  );
}

const SCENES = [VerseScene, BuildScene, AskScene];

// ─── Screen ───────────────────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: { onComplete: (exit: OnboardingExit) => void }) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const [step, setStep] = useState(0);
  useSystemBars(qm.bg);

  const isLast = step === SLIDES.length - 1;
  const finish = useCallback(async (exit: OnboardingExit) => {
    await storage.setOnboardingSeen(true);
    onComplete(exit);
  }, [onComplete]);

  const key = SLIDES[step];
  const Scene = SCENES[step];

  return (
    <View style={[styles.root, { backgroundColor: qm.bg }]}>
      <QMFog height={440} />
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Typography preset="qmBody" color={qm.muted} style={styles.tabular}>
            {t('onboarding.stepOf', { step: step + 1, total: SLIDES.length })}
          </Typography>
          {!isLast && (
            <Pressable onPress={() => finish('Login')} hitSlop={10} style={({ pressed }) => [styles.skip, pressed && styles.dim]} accessibilityRole="button">
              <Typography preset="qmLink" color={qm.muted} style={styles.skipText}>{t('onboarding.skip')}</Typography>
            </Pressable>
          )}
        </View>

        <Animated.View key={key} entering={FadeInRight.duration(550)} style={styles.flex}>
          <View style={styles.stage}><Scene /></View>
          <View style={styles.copy}>
            <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t(`onboarding.slides.${key}.title`)}</Typography>
            <Typography preset="qmLead" color={qm.muted} style={styles.sub}>{t(`onboarding.slides.${key}.subtitle`)}</Typography>
          </View>
        </Animated.View>

        <View style={styles.bottom}>
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {SLIDES.map((s, i) => (
              <View key={s} style={[styles.dot, { backgroundColor: i === step ? qm.violet : qm.dot }, i === step && styles.dotOn]} />
            ))}
          </View>
          {isLast ? (
            <>
              <QMButton label={t('onboarding.createMyAccount')} onPress={() => finish('Register')} />
              <Typography preset="qmLead" color={qm.muted} align="center" style={styles.signIn} onPress={() => finish('Login')}>
                {t('onboarding.haveAccount')} <Typography preset="qmLink" color={qm.link}>{t('onboarding.signIn')}</Typography>
              </Typography>
            </>
          ) : (
            <>
              <QMButton label={t('onboarding.next')} onPress={() => setStep(s => s + 1)} />
              <View style={styles.signInSlot} />
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  dim: { opacity: 0.6 },
  tabular: { fontVariant: ['tabular-nums'] },
  header: { height: 44, marginHorizontal: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { paddingVertical: spacing.s10, paddingHorizontal: spacing.xs },
  skipText: { fontSize: 15 },
  stage: { height: STAGE_H },
  copy: { paddingHorizontal: spacing.s28, paddingTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36 }, // canvas onboarding title 30px
  sub: { marginTop: spacing.md },

  // Scene 1
  stageCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backCard: {
    position: 'absolute', width: 230, height: 150, borderRadius: radius.r20 + 2, // ponytail: canvas scene card sizes
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '6deg' }, { translateX: 26 }, { translateY: 44 }],
  },
  verseTilt: { transform: [{ rotate: '-3deg' }] },
  verseCard: { width: 270, borderRadius: radius.lg, padding: spacing.s22 },
  verseRef: { fontSize: 12, letterSpacing: 0 },
  verseText: { marginTop: spacing.s10, fontSize: 18, lineHeight: 27 },

  // Scene 2
  buildGap: { gap: spacing.s22 + 4 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  fan: { width: 150, height: 110 },
  fanCard: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.r18 },
  fanLeft: { transform: [{ rotate: '-9deg' }, { translateX: -34 }] },
  fanRight: { transform: [{ rotate: '9deg' }, { translateX: 34 }] },
  fanFront: { justifyContent: 'center', padding: spacing.s14 },
  fanText: { marginTop: spacing.s6, fontSize: 14, lineHeight: 19 },

  // Scene 3
  askStage: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.s38 - 4 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '78%', borderRadius: radius.r18, borderBottomRightRadius: radius.r6, paddingVertical: spacing.s10 + 1, paddingHorizontal: spacing.s14 },
  aiWrap: { maxWidth: '86%' },
  aiOutline: { padding: 2, borderRadius: radius.r20, borderBottomLeftRadius: radius.sm },
  aiBubble: { borderRadius: radius.r18, borderBottomLeftRadius: radius.r6, paddingVertical: spacing.md, paddingHorizontal: spacing.s14 },
  pillRow: { flexDirection: 'row', gap: spacing.s6 },
  pill: { paddingVertical: spacing.s6, paddingHorizontal: spacing.s10, borderRadius: radius.pill },

  // Bottom
  bottom: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.s14 },
  dots: { flexDirection: 'row', gap: spacing.s6, justifyContent: 'center', marginBottom: spacing.s6 },
  dot: { width: spacing.sm, height: spacing.sm, borderRadius: spacing.xs },
  dotOn: { width: spacing.s28 - 2 },
  signIn: { fontSize: 15, minHeight: spacing.xxl },
  signInSlot: { height: spacing.xxl },
});
