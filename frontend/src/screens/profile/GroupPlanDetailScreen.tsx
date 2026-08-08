import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import type { PlanStep, MemberProgress } from '../../types';
import { usePlan, useToggleStep, useMembersProgress } from '../../hooks';
import { useAuthStore } from '../../store/auth.store';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorState } from '../../components/feedback/ErrorState';
import { CheckCircleIcon } from '../../components/icons';
import { type Theme, useTheme } from '../../theme';

export function GroupPlanDetailScreen({ navigation, route }: ProfileScreenProps<'GroupPlanDetail'>) {
  const { planId } = route.params;
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const userId = useAuthStore(s => s.user?.id);

  const { data: plan, isLoading, error, refetch } = usePlan(planId);
  const { data: members = [] } = useMembersProgress(planId);
  const toggleStep = useToggleStep(planId);

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
            ? navigation.navigate('LibraryTab', {
                screen: 'SetDetail',
                params: { setId: step.set.id, setTitle: step.set.title, isOwner: false },
              })
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

  const renderMember = (m: MemberProgress, rank: number) => {
    const ratio = m.total > 0 ? m.completed / m.total : 0;
    const isMe = m.userId === userId;
    return (
      <View key={m.userId} style={styles.memberRow}>
        <Typography preset="label" color={colors.textSecondary} style={styles.rank}>{rank + 1}</Typography>
        <Avatar uri={m.profileImage} name={m.name ?? ''} size="sm" />
        <View style={styles.memberBody}>
          <Typography preset="label" numberOfLines={1}>{m.name}{isMe ? ' (you)' : ''}</Typography>
          <ProgressBar progress={ratio} color={colors.primary} style={styles.memberBar} />
        </View>
        <Typography preset="caption" color={colors.textSecondary}>{m.completed}/{m.total}</Typography>
      </View>
    );
  };

  return (
    <Screen header={<ScreenHeader title={plan?.title ?? 'Group Plan'} onBack={navigation.goBack} />}>
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
            <Typography preset="bodySm" color={colors.success} style={styles.done}>🎉 You finished this plan!</Typography>
          )}

          <View style={styles.steps}>{plan.steps.map(renderStep)}</View>

          <Typography preset="label" color={colors.textSecondary} style={styles.leaderTitle}>Leaderboard</Typography>
          {members.map(renderMember)}
        </ScrollView>
      )}
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
  leaderTitle: { marginTop: spacing[5], marginBottom: spacing[2] },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] },
  rank: { width: 18, textAlign: 'center' },
  memberBody: { flex: 1, gap: spacing[1] },
  memberBar: { width: '100%' },
});
