import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Badge, Divider, Spacer, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EmptyState, ErrorState } from '../../components/feedback';
import { ChevronDownIcon, StarIcon } from '../../components/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCreditBalance, useCreditTransactions, useStreak } from '../../hooks';
import { WeeklyChart } from './components/WeeklyChart';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { CARD_FILL_LIGHT, fontSizes, fontWeights, layout, radius, spacing, useTheme, palette } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { TransactionType } from '../../types';
import type { CreditStatsPeriod } from '../../hooks/useCredits';

const TYPE_CONFIG: Record<TransactionType, { label: string; variant: 'error' | 'success' | 'info' | 'primary'; sign: string }> = {
  USAGE:    { label: 'Used',     variant: 'error',   sign: '−' },
  REWARD:   { label: 'Reward',   variant: 'success', sign: '+' },
  PURCHASE: { label: 'Purchase', variant: 'info',    sign: '+' },
  BONUS:    { label: 'Bonus',    variant: 'primary', sign: '+' },
};

// ── Balance card (gradient hero) ─────────────────────────────────────────────

function BalanceCard({ onGetMore }: { onGetMore: () => void }) {
  const { colors } = useTheme();
  const { data, isLoading } = useCreditBalance();
  const { data: streakData } = useStreak();
  const streak = streakData?.streak ?? 0;

  return (
    <View style={styles.balanceCard}>
      <LinearGradient
        colors={[palette.indigo600, palette.indigo500, palette.violet500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.balanceHeader}>
        <Typography preset="caption" color="rgba(255,255,255,0.7)" style={styles.balanceLabel}>
          CURRENT BALANCE
        </Typography>
        {streak > 0 && (
          <View style={styles.streakPill}>
            <Typography preset="caption" color={palette.white}>🔥 {streak}</Typography>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={palette.white} />
      ) : (
        <View style={styles.balanceRow}>
          <StarIcon size={28} color="rgba(255,255,255,0.9)" />
          <Typography preset="h2" color={palette.white} style={styles.balanceAmount}>
            {data?.balance ?? 0}
          </Typography>
          <Typography preset="bodyLg" color="rgba(255,255,255,0.7)">credits</Typography>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, { backgroundColor: palette.white }, pressed && { opacity: 0.85 }]}
        onPress={onGetMore}
      >
        <Typography preset="label" color={palette.indigo500} style={styles.ctaBtnText}>Get More Credits</Typography>
      </Pressable>
    </View>
  );
}

// ── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  return (
    <View style={[
      styles.statTile,
      { backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT },
      !isDark && styles.statTileShadow,
    ]}>
      <Typography preset="h4" color={valueColor ?? colors.textPrimary}>{value}</Typography>
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </View>
  );
}

// ── TrendWindowPill ───────────────────────────────────────────────────────────

const WINDOW_OPTIONS: { key: CreditStatsPeriod; label: string }[] = [
  { key: 'week',  label: '7 Days'  },
  { key: 'month', label: '30 Days' },
];

function TrendWindowPill({ value, onToggle }: { value: CreditStatsPeriod; onToggle: () => void }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const label = WINDOW_OPTIONS.find(o => o.key === value)?.label ?? '7 Days';
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      style={[
        styles.pill,
        isDark
          ? { backgroundColor: colors.chipIdle, borderColor: 'transparent' }
          : { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        !isDark && styles.pillShadow,
      ]}
    >
      <Typography preset="label" color={colors.textPrimary}>{label}</Typography>
      <ChevronDownIcon size={14} color={colors.textPrimary} />
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function CreditsScreen({ navigation }: ProfileScreenProps<'Credits'>) {
  const theme = useTheme();
  const { colors } = theme;
  const qc = useQueryClient();

  const [chartWindow, setChartWindow] = useState<CreditStatsPeriod>('week');

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

  // Compute all-time totals from loaded transactions
  const { totalEarned, totalUsed } = useMemo(() => {
    let earned = 0, used = 0;
    for (const t of transactions) {
      if (t.type === 'USAGE') used += t.amount;
      else earned += t.amount;
    }
    return { totalEarned: earned, totalUsed: used };
  }, [transactions]);

  const { data: creditData } = useCreditBalance();
  const { data: streakData } = useStreak();

  const amountColor: Record<TransactionType, string> = {
    USAGE:    colors.alert,
    REWARD:   colors.success,
    PURCHASE: colors.info,
    BONUS:    colors.accent,
  };

  const toggleWindow = () =>
    setChartWindow(w => w === 'week' ? 'month' : 'week');

  return (
    <Screen header={<ScreenHeader title="Credits" onBack={() => navigation.goBack()} />}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={() => { void Promise.all([refetch(), qc.invalidateQueries({ queryKey: ['credits', 'stats'] })]); }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <>
              {/* Balance hero card */}
              <BalanceCard onGetMore={() => navigation.navigate('Paywall')} />

              {/* ── Stat grid ── */}
              <View style={styles.statGrid}>
                <StatTile label="Balance" value={creditData?.balance ?? 0} valueColor={colors.accent} />
                <StatTile label="Earned" value={`+${totalEarned}`} valueColor={colors.success} />
                <StatTile label="Used" value={`−${totalUsed}`} valueColor={colors.alert} />
                <StatTile label="Streak" value={`🔥 ${streakData?.streak ?? 0}`} />
              </View>

              {/* ── Chart section header + TrendWindowPill ── */}
              <View style={styles.chartHeader}>
                <Typography preset="h4" color={colors.textPrimary}>Credit Activity</Typography>
                <TrendWindowPill value={chartWindow} onToggle={toggleWindow} />
              </View>

              {/* Chart — key forces re-mount when window changes */}
              <WeeklyChart key={chartWindow} defaultPeriod={chartWindow} />

              <Spacer size={spacing.xxl} />
              <Typography preset="h4" style={styles.historyTitle}>Transaction History</Typography>
              <Divider marginV={0} />
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
                <ActivityIndicator color={colors.accent} />
              </View>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View style={styles.txTopRow}>
                    <Badge label={cfg.label} variant={cfg.variant} />
                    <Typography preset="caption" color={colors.textDisabled}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </View>
                  <Typography preset="caption" color={colors.textSecondary} numberOfLines={1}>
                    {item.description}
                  </Typography>
                </View>
                <Typography preset="h4" color={amountColor[item.type]} style={styles.txAmount}>
                  {cfg.sign}{Math.abs(item.amount)}
                </Typography>
              </View>
            );
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: layout.screenPaddingH, paddingBottom: spacing.huge },

  // Balance card
  balanceCard: {
    borderRadius: layout.cardRadiusLg,
    overflow: 'hidden',
    padding: spacing.xl,
    gap: spacing.lg,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 8 }, default: {} }),
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { letterSpacing: 1, fontSize: fontSizes.xs },
  streakPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.pillRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceAmount: { fontWeight: fontWeights.bold },
  ctaBtn: { borderRadius: layout.cardRadius, paddingVertical: spacing.md, alignItems: 'center' },
  ctaBtnText: { fontWeight: fontWeights.semiBold },

  // Stat grid — 2×2
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statTile: {
    width: '47.5%',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.s2,
    alignItems: 'center',
  },
  statTileShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // Chart section header
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },

  // TrendWindowPill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s7,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
  },
  pillShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  // Transaction list
  historyTitle: { marginBottom: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  txLeft: { flex: 1, gap: spacing.xs },
  txTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txAmount: { minWidth: 48, textAlign: 'right' },

  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing.huge, alignItems: 'center' },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});
