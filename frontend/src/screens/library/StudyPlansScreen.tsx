import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import type { LibraryScreenProps } from '../../navigation/types';
import type { PlanListItem } from '../../types';
import { usePlans } from '../../hooks';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PlusIcon, BookIcon } from '../../components/icons';
import { type Theme, useTheme } from '../../theme';

export function StudyPlansScreen({ navigation }: LibraryScreenProps<'StudyPlans'>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: plans = [], isLoading, error, refetch } = usePlans();

  const renderItem = ({ item }: { item: PlanListItem }) => {
    const pct = item.totalSteps > 0 ? item.completedSteps / item.totalSteps : 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
      >
        <Typography preset="h4" numberOfLines={1}>{item.title}</Typography>
        {!!item.description && (
          <Typography preset="caption" color={colors.textSecondary} numberOfLines={2}>{item.description}</Typography>
        )}
        <View style={styles.progressRow}>
          <ProgressBar progress={pct} color={colors.primary} style={styles.bar} />
          <Typography preset="caption" color={colors.textSecondary}>
            {item.completedSteps}/{item.totalSteps}
          </Typography>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Study Plans"
          onBack={navigation.goBack}
          right={
            <Pressable onPress={() => navigation.navigate('CreatePlan')} hitSlop={8}>
              <PlusIcon size={22} color={colors.primary} />
            </Pressable>
          }
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<BookIcon size={48} color={colors.primaryLight} />}
          title="No study plans yet"
          subtitle="Create a guided path through your sets — step by step."
          ctaLabel="Create a plan"
          onCta={() => navigation.navigate('CreatePlan')}
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: layout.screenPaddingH, gap: spacing[3] },
  card: {
    backgroundColor: colors.backgroundCard, borderRadius: layout.cardRadius,
    borderWidth: 1, borderColor: colors.border, padding: spacing[4], gap: spacing[2],
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] },
  bar: { flex: 1 },
});
