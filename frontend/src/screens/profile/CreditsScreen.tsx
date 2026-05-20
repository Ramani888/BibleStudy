import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/Ionicons';
import { Badge, Card, Divider, Spacer, Typography } from '../../components/ui';
import { EmptyState, ErrorState } from '../../components/feedback';
import { useCreditBalance, useCreditTransactions, useWeeklyCredits } from '../../hooks';

const BALANCE_ICON_SIZE = 32;
const MAX_BAR_HEIGHT = 80;
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { colors, fontSizes, layout, spacing } from '../../theme';
import type { TransactionType } from '../../types';

const TYPE_CONFIG: Record<TransactionType, { label: string; variant: 'error' | 'success' | 'info' | 'primary'; sign: string }> = {
  USAGE:    { label: 'Used',     variant: 'error',   sign: '−' },
  REWARD:   { label: 'Reward',   variant: 'success', sign: '+' },
  PURCHASE: { label: 'Purchase', variant: 'info',    sign: '+' },
  BONUS:    { label: 'Bonus',    variant: 'primary', sign: '+' },
};

const AMOUNT_COLOR: Record<TransactionType, string> = {
  USAGE:    colors.error,
  REWARD:   colors.success,
  PURCHASE: colors.info,
  BONUS:    colors.primary,
};

function WeeklyChart() {
  const { data: stats, isLoading } = useWeeklyCredits();

  const maxTotal = Math.max(...(stats ?? []).map(d => d.earned + d.used), 1);
  const hasData = (stats ?? []).some(d => d.earned > 0 || d.used > 0);

  return (
    <Card style={styles.chartCard} shadow="sm">
      <View style={styles.chartHeader}>
        <Typography preset="h4">Weekly Overview</Typography>
        <View style={styles.chartLegend}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !hasData ? (
        <Typography preset="bodySm" color={colors.textDisabled} style={styles.chartEmpty}>
          No activity this week
        </Typography>
      ) : (
        <View style={styles.chartBars}>
          {(stats ?? []).map((day, idx) => {
            const total = day.earned + day.used;
            const barH = (total / maxTotal) * MAX_BAR_HEIGHT;
            const earnedH = total > 0 ? (day.earned / total) * barH : 0;
            const usedH = total > 0 ? (day.used / total) * barH : 0;
            return (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.chartTrack}>
                  {total > 0 && (
                    <View style={[styles.chartStack, { height: barH }]}>
                      {usedH > 0 && (
                        <View style={[styles.chartSegment, { height: usedH, backgroundColor: colors.error }]} />
                      )}
                      {earnedH > 0 && (
                        <View style={[styles.chartSegment, { height: earnedH, backgroundColor: colors.success }]} />
                      )}
                    </View>
                  )}
                </View>
                <Typography preset="caption" color={colors.textDisabled}>{day.label}</Typography>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

function BalanceCard() {
  const { data, isLoading } = useCreditBalance();

  return (
    <Card style={styles.balanceCard} shadow="md">
      <Typography preset="label" color={colors.primaryDark} style={styles.balanceLabel}>
        CURRENT BALANCE
      </Typography>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.balanceRow}>
          <Icon name="star" size={BALANCE_ICON_SIZE} color={colors.primary} />
          <Typography preset="h1" color={colors.primary}>
            {data?.balance ?? 0}
          </Typography>
          <Typography preset="h4" color={colors.textSecondary}>credits</Typography>
        </View>
      )}
    </Card>
  );
}

export function CreditsScreen() {
  const { refetch: refetchWeekly, isFetching: weeklyFetching } = useWeeklyCredits();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCreditTransactions();

  const transactions = data?.pages.flatMap(p => p.transactions) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={(isFetching && !isFetchingNextPage) || weeklyFetching}
        onRefresh={() => { void Promise.all([refetch(), refetchWeekly()]); }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            <BalanceCard />
            <Spacer size={spacing[4]} />
            <WeeklyChart />
            <Spacer size={spacing[6]} />
            <Typography preset="h4" style={styles.historyTitle}>Transaction History</Typography>
          </>
        }
        ItemSeparatorComponent={() => <Divider marginV={0} />}
        ListEmptyComponent={
          isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          ) : !isLoading ? (
            <EmptyState
              title="No transactions yet"
              subtitle="Credits you earn or use will appear here"
              style={styles.emptyState}
            />
          ) : (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <Badge label={cfg.label} variant={cfg.variant} />
                <Typography preset="bodySm" color={colors.textSecondary} numberOfLines={1} style={styles.txDesc}>
                  {item.description}
                </Typography>
                <Typography preset="caption" color={colors.textDisabled}>
                  {formatDate(item.createdAt)}
                </Typography>
              </View>
              <Typography preset="h4" color={AMOUNT_COLOR[item.type]} style={styles.txAmount}>
                {cfg.sign}{Math.abs(item.amount)}
              </Typography>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundSecondary },
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
  balanceCard: { gap: spacing[3], backgroundColor: colors.background, marginTop: spacing[2] },
  balanceLabel: { letterSpacing: 1, fontSize: fontSizes.xs },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  historyTitle: { marginBottom: spacing[2] },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], gap: spacing[3] },
  txLeft: { flex: 1, gap: spacing[1] },
  txDesc: { maxWidth: '90%' },
  txAmount: { minWidth: 48, textAlign: 'right' },
  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing[10], alignItems: 'center' },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },

  // Weekly chart
  chartCard: { backgroundColor: colors.background, gap: spacing[3] },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  chartBars: { flexDirection: 'row', gap: spacing[2] },
  chartCol: { flex: 1, alignItems: 'center', gap: spacing[1] },
  chartTrack: {
    width: '100%',
    height: MAX_BAR_HEIGHT,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartStack: { width: '100%' },
  chartSegment: { width: '100%' },
  chartLoading: { height: MAX_BAR_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  chartEmpty: { textAlign: 'center', paddingVertical: spacing[4] },
});
