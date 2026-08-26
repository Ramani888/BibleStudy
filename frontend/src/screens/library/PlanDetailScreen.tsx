import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { useTranslation } from 'react-i18next';
import type { LibraryScreenProps } from '../../navigation/types';
import type { PlanStep } from '../../types';
import { usePlan, useToggleStep, useDeletePlan, useConfirmDialog } from '../../hooks';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback';
import { CheckCircleIcon, TrashIcon } from '../../components/icons';
import { getErrorMessage } from '../../api';
import { layout, radius, spacing, useTheme } from '../../theme';

export function PlanDetailScreen({ navigation, route }: LibraryScreenProps<'PlanDetail'>) {
  const { t } = useTranslation(['library', 'common']);
  const { planId } = route.params;
  const { colors } = useTheme();
  const { data: plan, isLoading, error, refetch } = usePlan(planId);
  const toggleStep = useToggleStep(planId);
  const deletePlan = useDeletePlan();
  const { show, dialogProps } = useConfirmDialog();

  const handleDelete = useCallback(() => {
    show({
      title: t('library:plans.deletePlanTitle', 'Delete plan?'),
      message: t('library:plans.deletePlanMessage', 'This removes the plan and its progress. Your sets are not affected.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: () =>
        deletePlan.mutate(planId, {
          onSuccess: () => navigation.goBack(),
          onError: e => Toast.show({ type: 'error', text1: t('common:status.couldNotDelete', 'Could not delete'), text2: getErrorMessage(e) }),
        }),
    });
  }, [show, deletePlan, planId, navigation, t]);

  const renderStep = (step: PlanStep, index: number) => (
    <View key={step.id} style={[styles.step, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={() => toggleStep.mutate({ stepId: step.id, completed: step.completed })}
        hitSlop={8}
        disabled={toggleStep.isPending}
        style={({ pressed }) => pressed && styles.iconPressed}
      >
        {step.completed
          ? <CheckCircleIcon size={26} color={colors.success} />
          : <View style={[styles.emptyCircle, { borderColor: colors.textDisabled }]} />}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.stepBody, step.set && pressed && styles.rowPressed]}
        onPress={() =>
          step.set
            ? navigation.navigate('SetDetail', { setId: step.set.id, setTitle: step.set.title, isOwner: true })
            : undefined
        }
        disabled={!step.set}
      >
        <Typography preset="body" numberOfLines={1} color={step.completed ? colors.textSecondary : colors.textPrimary}>
          {index + 1}. {step.title || step.set?.title || t('library:sets.setRemoved', 'Set removed')}
        </Typography>
        {step.set && (
          <Typography preset="caption" color={colors.textSecondary}>{t('library:cards.cardCount', { count: step.set.cardCount, defaultValue: `${step.set.cardCount} cards` })}</Typography>
        )}
      </Pressable>
    </View>
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={plan?.title ?? t('library:plans.plan', 'Plan')}
          onBack={navigation.goBack}
          right={
            <Pressable onPress={handleDelete} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <TrashIcon size={20} color={colors.textSecondary} />
            </Pressable>
          }
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>
      ) : error || !plan ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View>
          {!!plan.description && (
            <Typography preset="body" color={colors.textSecondary} style={styles.desc}>{plan.description}</Typography>
          )}
          <View style={styles.progressRow}>
            <ProgressBar progress={plan.totalSteps > 0 ? plan.completedSteps / plan.totalSteps : 0} color={colors.accent} style={styles.bar} />
            <Typography preset="label" color={colors.accent}>{plan.completedSteps}/{plan.totalSteps}</Typography>
          </View>
          {plan.completedSteps === plan.totalSteps && plan.totalSteps > 0 && (
            <Typography preset="bodySm" color={colors.success} style={styles.done}>{t('library:plans.planComplete', '🎉 Plan complete!')}</Typography>
          )}
          </View>
          <View>
          <View style={styles.steps}>{plan.steps.map(renderStep)}</View>
          </View>
        </ScrollView>
      )}
      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxxl },
  desc: { marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  bar: { flex: 1 },
  done: { marginBottom: spacing.sm },
  steps: { marginTop: spacing.md, gap: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  stepBody: { flex: 1, gap: spacing.s2 },
  emptyCircle: { width: spacing.xxl, height: spacing.xxl, borderRadius: radius.r12, borderWidth: 2 },
  iconPressed: { opacity: 0.85 },
  rowPressed: { opacity: 0.7 },
});
