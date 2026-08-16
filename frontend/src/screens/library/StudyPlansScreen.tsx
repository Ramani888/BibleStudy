import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import type { LibraryScreenProps } from '../../navigation/types';
import type { PlanListItem } from '../../types';
import { usePlans, useManualRefresh } from '../../hooks';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { PlusIcon, BookIcon } from '../../components/icons';
import { CARD_FILL_LIGHT, layout, spacing, useTheme } from '../../theme';

export function StudyPlansScreen({ navigation }: LibraryScreenProps<'StudyPlans'>) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const { data: plans = [], isLoading, error, refetch } = usePlans();
  const { refreshing, onRefresh } = useManualRefresh(refetch);

  const handleNavCreatePlan = useCallback(() => navigation.navigate('CreatePlan'), [navigation]);

  const renderItem = useCallback(({ item }: { item: PlanListItem }) => {
    const pct = item.totalSteps > 0 ? item.completedSteps / item.totalSteps : 0;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          !isDark && styles.cardShadow,
          { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT, borderColor: colors.cardBorder },
          pressed && styles.cardPressed,
        ]}
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
  }, [navigation, isDark, colors]);

  return (
    <Screen
      header={
        <ScreenHeader
          title="Study Plans"
          onBack={navigation.goBack}
          right={
            <Pressable onPress={handleNavCreatePlan} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
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
        <View style={styles.centered}>
          <EmptyState
            icon={<BookIcon size={48} color={colors.accent} />}
            title="No study plans yet"
            subtitle="Tap + to create a guided path through your sets."
          />
        </View>
      ) : (
        <View style={styles.flex}>
        <FlatList
          data={plans}
          keyExtractor={p => p.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  list: { padding: layout.screenPaddingH, gap: spacing.md },
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: { opacity: 0.7 },
  iconPressed: { opacity: 0.85 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  bar: { flex: 1 },
});
