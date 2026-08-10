import React from 'react';
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
import { layout, spacing, useTheme, palette } from '../../theme';

export function StudyPlansScreen({ navigation }: LibraryScreenProps<'StudyPlans'>) {
  const { colors } = useTheme();
  const { data: plans = [], isLoading, error, refetch } = usePlans();

  const renderItem = ({ item }: { item: PlanListItem }) => {
    const pct = item.totalSteps > 0 ? item.completedSteps / item.totalSteps : 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('PlanDetail', { planId: item.id })}
      >
        <Typography preset="h4" numberOfLines={1}>{item.title}</Typography>
        {!!item.description && (
          <Typography preset="caption" color={colors.textSecondary} numberOfLines={2}>{item.description}</Typography>
        )}
        <View style={styles.progressRow}>
          <ProgressBar progress={pct} color={colors.accent} style={styles.bar} />
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
              <PlusIcon size={22} color={colors.accent} />
            </Pressable>
          }
        />
      }
    >
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator color={colors.accent} /></View>
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : plans.length === 0 ? (
        <View>
          <EmptyState
            icon={<BookIcon size={48} color={palette.indigo300} />}
            title="No study plans yet"
            subtitle="Create a guided path through your sets — step by step."
            ctaLabel="Create a plan"
            onCta={() => navigation.navigate('CreatePlan')}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: layout.screenPaddingH, gap: spacing.md },
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  bar: { flex: 1 },
});
