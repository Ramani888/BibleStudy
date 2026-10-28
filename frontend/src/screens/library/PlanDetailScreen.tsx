import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMButton, QMConfirmDialog, QMEmpty, QMSheet, type QMSheetAction } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { AskIcon, CheckIcon, ChevronLeftIcon, LeafIcon, RefreshIcon, ShareUpIcon, TrashIcon } from '../../components/icons';
import { usePlan, useToggleStep, useDeletePlan, useConfirmDialog, useReferral, useManualRefresh, useTabBarSpace } from '../../hooks';
import { getErrorMessage } from '../../api';
import { shareToWhatsApp, buildReferralLink } from '../../utils';
import { useTheme, spacing, radius, mixHex } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { PlanStep } from '../../types';

const TOUCH = 44;
const CHECK = 36;
const TRACK_H = 8;
const FROST = { light: 'rgba(255,255,255,0.6)', dark: 'rgba(0,0,0,0.22)' } as const;

export function PlanDetailScreen({ navigation, route }: LibraryScreenProps<'PlanDetail'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const tabSpace = useTabBarSpace();
  const dark = themeName === 'dark';
  const insets = useSafeAreaInsets();
  const { planId } = route.params;
  const { data: plan, isLoading, error, refetch } = usePlan(planId);
  const { refreshing, onRefresh } = useManualRefresh(refetch);
  const toggleStep = useToggleStep(planId);
  const deletePlan = useDeletePlan();
  const { show, dialogProps } = useConfirmDialog();
  const { data: referral } = useReferral();
  const [shareOpen, setShareOpen] = useState(false);

  const shareText = useCallback(() => (plan ? t('library:plans.shareMessage', {
    title: plan.title,
    url: buildReferralLink(referral?.code),
    defaultValue: 'Studying "{{title}}" on Verdance 📖 Want to join me? {{url}}',
  }) : ''), [plan, referral?.code, t]);

  const handleDelete = useCallback(() => {
    show({
      title: t('library:qm.deletePlanTitle', 'Delete this plan?'),
      message: t('library:qm.deletePlanMessage', 'Your sets stay in your library. Only the plan goes.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: () =>
        deletePlan.mutate(planId, {
          onSuccess: () => navigation.goBack(),
          onError: e => Toast.show({ type: 'error', text1: t('common:status.couldNotDelete', 'Could not delete'), text2: getErrorMessage(e) }),
        }),
    });
  }, [show, deletePlan, planId, navigation, t]);

  const openSet = useCallback((step: PlanStep) => {
    if (step.set) navigation.navigate('SetDetail', { setId: step.set.id, setTitle: step.set.title, isOwner: true });
  }, [navigation]);

  const shareActions: QMSheetAction[] = [
    { label: t('library:qm.shareWhatsApp', 'Share on WhatsApp'), icon: AskIcon, onPress: () => shareToWhatsApp(shareText(), 'plan') },
    { label: t('library:qm.shareMore', 'More ways to share'), icon: ShareUpIcon, onPress: () => { Share.share({ message: shareText() }).catch(() => {}); } },
  ];

  const frost = dark ? FROST.dark : FROST.light;
  const roundBtn = (onPress: () => void, label: string, icon: React.ReactNode) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.round, { backgroundColor: frost }, pressed && styles.dim]} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
    </Pressable>
  );

  if (isLoading || error || !plan) {
    return (
      <View style={[styles.flex, { backgroundColor: qm.bg, paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.pad}>{roundBtn(navigation.goBack, t('common:actions.back', 'Back'), <ChevronLeftIcon size={20} color={qm.ink} />)}</View>
        {isLoading
          ? <ActivityIndicator color={qm.violet} style={styles.loading} />
          : <QMEmpty style={styles.loading} icon={RefreshIcon}
              title={t('library:qm.planFailedTitle', 'This plan did not load')}
              text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
              action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: () => refetch() }} />}
      </View>
    );
  }

  const total = plan.totalSteps;
  const count = plan.completedSteps;
  const complete = total > 0 && count === total;
  const pct = total ? count / total : 0;
  const nextIdx = plan.steps.findIndex(s => !s.completed && !!s.set);
  const next = nextIdx >= 0 ? plan.steps[nextIdx] : null;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxxl + tabSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={qm.violet} progressViewOffset={insets.top} />}
      >
        <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <LinearGradient colors={[...qm.verse]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.heroBar}>
            {roundBtn(navigation.goBack, t('common:actions.back', 'Back'), <ChevronLeftIcon size={20} color={qm.verseInk} />)}
            <View style={styles.heroBtns}>
              {roundBtn(() => setShareOpen(true), t('library:qm.sharePlan', 'Share plan'), <ShareUpIcon size={19} color={qm.verseInk} strokeWidth={2} />)}
              {roundBtn(handleDelete, t('library:qm.deletePlan', 'Delete plan'), <TrashIcon size={19} color={qm.verseInk} strokeWidth={2} />)}
            </View>
          </View>
          <View style={styles.heroText}>
            <Typography preset="qmPageTitle" color={qm.verseInk}>{plan.title}</Typography>
            {plan.description ? <Typography preset="qmBodyMd" color={qm.body} style={styles.desc}>{plan.description}</Typography> : null}
            <View style={styles.progressHead}>
              <Typography preset="qmLink" color={qm.verseInk}>{t('library:qm.yourProgress', 'Your progress')}</Typography>
              <Typography preset="qmLink" color={qm.verseInk}>{t('library:qm.stepsOf', { done: count, total, defaultValue: `${count} of ${total} steps` })}</Typography>
            </View>
            <View style={[styles.track, { backgroundColor: mixHex(qm.violet, qm.verse[1], dark ? 0.2 : 0.15) }]}>
              <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: complete ? qm.leaf : qm.violet }]} />
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {complete && (
            <Animated.View entering={FadeIn.duration(250)} style={[styles.party, { backgroundColor: qm.leafBg }]}>
              <LeafIcon size={28} color={qm.leaf} filled />
              <View style={styles.flex}>
                <Typography preset="qmSheetTitle" color={qm.leafText}>{t('library:qm.planComplete', 'Plan complete')}</Typography>
                <Typography preset="qmBody" color={qm.body}>{t('library:qm.planCompleteText', 'You finished every step. Well done.')}</Typography>
              </View>
            </Animated.View>
          )}
          {next?.set && (
            <View style={[styles.next, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
              <Typography preset="qmLabel" color={qm.link}>{t('library:qm.upNext', { n: nextIdx + 1, defaultValue: `Up next: step ${nextIdx + 1}` })}</Typography>
              <Typography preset="qmSheetTitle" color={qm.ink} style={styles.nextTitle}>{next.title || next.set.title}</Typography>
              <Typography preset="qmBody" color={qm.muted}>{t('library:cards.cardCount', { count: next.set.cardCount })}</Typography>
              <QMButton label={t('library:qm.openThisSet', 'Open this set')} onPress={() => openSet(next)} style={styles.nextBtn} />
            </View>
          )}

          <Typography preset="qmSection" color={qm.ink} style={styles.stepsH}>{t('library:qm.steps', 'Steps')}</Typography>
          <View>
            <View style={[styles.rail, { backgroundColor: qm.line }]} />
            {plan.steps.map((step, i) => {
              const done = step.completed;
              const isNext = i === nextIdx;
              const removed = !step.set;
              return (
                <View key={step.id} style={styles.stepRow}>
                  <Pressable
                    onPress={() => toggleStep.mutate({ stepId: step.id, completed: step.completed })}
                    disabled={toggleStep.isPending}
                    hitSlop={6}
                    style={[styles.check, {
                      borderColor: done ? qm.leaf : isNext ? qm.violet : qm.line,
                      backgroundColor: done ? qm.leaf : qm.bg,
                    }]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={t('library:qm.markStep', { n: i + 1, defaultValue: `Mark step ${i + 1} as done` })}
                  >
                    {done
                      ? <Animated.View entering={FadeIn.duration(250)}><CheckIcon size={16} color={qm.onViolet} strokeWidth={3} /></Animated.View>
                      : <Typography preset="qmTag" color={isNext ? qm.link : qm.muted} style={styles.stepN}>{i + 1}</Typography>}
                  </Pressable>
                  <AnimatedPressable
                    scaleTo={0.98}
                    disabled={removed}
                    onPress={() => openSet(step)}
                    style={[
                      styles.stepCard,
                      isNext ? { backgroundColor: qm.lilac } : { backgroundColor: qm.surface, boxShadow: qm.cardShadow },
                      removed ? styles.removed : done ? styles.doneRow : null,
                    ]}
                    accessibilityRole="button"
                  >
                    <Typography preset="qmButton" color={qm.ink} numberOfLines={1} style={done && [styles.strike, { textDecorationColor: qm.muted }]}>
                      {removed ? t('library:sets.setRemoved', 'Set removed') : step.title || step.set?.title}
                    </Typography>
                    <Typography preset="qmMeta" color={qm.muted} style={styles.stepMeta}>
                      {removed ? t('library:qm.setWasDeleted', 'This set was deleted') : t('library:cards.cardCount', { count: step.set?.cardCount ?? 0 })}
                    </Typography>
                  </AnimatedPressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <QMSheet visible={shareOpen} onClose={() => setShareOpen(false)} title={t('library:qm.sharePlanTitle', 'Share this plan')} sub={plan.title} actions={shareActions} />
      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  pad: { paddingHorizontal: spacing.lg },
  loading: { marginTop: spacing.huge },
  content: { paddingBottom: spacing.xxxl },
  hero: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, overflow: 'hidden',
    borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
  },
  heroBar: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBtns: { flexDirection: 'row', gap: spacing.sm },
  round: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  heroText: { paddingTop: spacing.lg, paddingHorizontal: spacing.xs },
  desc: { marginTop: spacing.sm },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.s18 },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: '100%', borderRadius: TRACK_H / 2 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  party: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, padding: spacing.s18, borderRadius: radius.r21 + 1 },
  next: { padding: spacing.s18, borderRadius: radius.r21 + 1 },
  nextTitle: { marginTop: spacing.s6 },
  nextBtn: { marginTop: spacing.s14, height: 52, borderRadius: radius.md },
  stepsH: { marginTop: spacing.md, fontSize: 16 },
  rail: { position: 'absolute', left: CHECK / 2 - 1, top: spacing.xxl, bottom: spacing.xxl, width: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, paddingVertical: spacing.s6 },
  check: { width: CHECK, height: CHECK, borderRadius: CHECK / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepN: { fontSize: 13 },
  stepCard: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.md },
  removed: { opacity: 0.55 },
  doneRow: { opacity: 0.75 },
  strike: { textDecorationLine: 'line-through' },
  stepMeta: { marginTop: spacing.s2 },
});
