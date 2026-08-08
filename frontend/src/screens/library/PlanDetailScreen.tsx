import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

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
import { type Theme, useTheme } from '../../theme';

export function PlanDetailScreen({ navigation, route }: LibraryScreenProps<'PlanDetail'>) {
  const { planId } = route.params;
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: plan, isLoading, error, refetch } = usePlan(planId);
  const toggleStep = useToggleStep(planId);
  const deletePlan = useDeletePlan();
  const { show, dialogProps } = useConfirmDialog();

  const handleDelete = () => {
    show({
      title: 'Delete plan?',
      message: 'This removes the plan and its progress. Your sets are not affected.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () =>
        deletePlan.mutate(planId, {
          onSuccess: () => navigation.goBack(),
          onError: e => Toast.show({ type: 'error', text1: 'Could not delete', text2: getErrorMessage(e) }),
        }),
    });
  };

  const renderStep = (step: PlanStep, index: number) => (
    <View key={step.id} style={styles.step}>
      <Pressable
        onPress={() => toggleStep.mutate({ stepId: step.id, completed: step.completed })}
        hitSlop={8}
        disabled={toggleStep.isPending}
      >
        {step.completed
          ? <CheckCircleIcon size={26} color={colors.success} />
          : <View style={styles.emptyCircle} />}
      </Pressable>
      <Pressable
        style={styles.stepBody}
        onPress={() =>
          step.set
            ? navigation.navigate('SetDetail', { setId: step.set.id, setTitle: step.set.title, isOwner: true })
            : undefined
        }
      >
        <Typography preset="body" numberOfLines={1} color={step.completed ? colors.textSecondary : colors.textPrimary}>
          {index + 1}. {step.title || step.set?.title || 'Set removed'}
        </Typography>
        {step.set && (
          <Typography preset="caption" color={colors.textSecondary}>{step.set.cardCount} cards</Typography>
        )}
      </Pressable>
    </View>
  );

  return (
    <Screen
      header={
        <ScreenHeader
          title={plan?.title ?? 'Plan'}
          onBack={navigation.goBack}
          right={
            <Pressable onPress={handleDelete} hitSlop={8}>
              <TrashIcon size={20} color={colors.textSecondary} />
            </Pressable>
          }
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
      ) : error || !plan ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {!!plan.description && (
            <Typography preset="body" color={colors.textSecondary} style={styles.desc}>{plan.description}</Typography>
          )}
          <View style={styles.progressRow}>
            <ProgressBar progress={plan.totalSteps > 0 ? plan.completedSteps / plan.totalSteps : 0} color={colors.primary} style={styles.bar} />
            <Typography preset="label" color={colors.primary}>{plan.completedSteps}/{plan.totalSteps}</Typography>
          </View>
          {plan.completedSteps === plan.totalSteps && plan.totalSteps > 0 && (
            <Typography preset="bodySm" color={colors.success} style={styles.done}>🎉 Plan complete!</Typography>
          )}
          <View style={styles.steps}>{plan.steps.map(renderStep)}</View>
        </ScrollView>
      )}
      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[8] },
  desc: { marginBottom: spacing[3] },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
  bar: { flex: 1 },
  done: { marginBottom: spacing[2] },
  steps: { marginTop: spacing[3], gap: spacing[1] },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border },
  stepBody: { flex: 1, gap: spacing[0.5] },
  emptyCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.textDisabled },
});
