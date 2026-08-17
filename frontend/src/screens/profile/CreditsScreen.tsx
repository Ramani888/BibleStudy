import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Badge, Divider, Spacer, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EmptyState, ErrorState } from '../../components/feedback';
import { StarIcon } from '../../components/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCreditBalance, useCreditTransactions, useStreak } from '../../hooks';
import { WeeklyChart } from './components/WeeklyChart';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { fontSizes, fontWeights, layout, spacing, useTheme, palette } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { CreditTransaction, TransactionType } from '../../types';

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
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        onPress={onGetMore}
      >
        <Typography preset="label" color={palette.indigo500} style={styles.ctaBtnText}>Get More Credits</Typography>
      </Pressable>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function CreditsScreen({ navigation }: ProfileScreenProps<'Credits'>) {
  const theme = useTheme();
  const { colors } = theme;
  const qc = useQueryClient();

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

  const transactions = useMemo(() => data?.pages.flatMap(p => p.transactions) ?? [], [data]);

  const amountColor = useMemo<Record<TransactionType, string>>(() => ({
    USAGE:    colors.alert,
    REWARD:   colors.success,
    PURCHASE: colors.info,
    BONUS:    colors.accent,
  }), [colors]);

  const renderTxItem = useCallback(({ item }: { item: CreditTransaction }) => {
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
  }, [colors, amountColor]);

  return (
    <Screen edges={['top']} header={<ScreenHeader title="Credits" onBack={() => navigation.goBack()} />}>
      <View style={styles.flex}>
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={() => { void Promise.all([refetch(), qc.invalidateQueries({ queryKey: ['credits', 'stats'] })]); }}
              tintColor={colors.accent}
            />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <>
              {/* Balance hero card */}
              <BalanceCard onGetMore={() => navigation.navigate('Paywall')} />

              <Spacer size={spacing.xl} />
              <WeeklyChart />

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
          renderItem={renderTxItem}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  ctaBtn: { borderRadius: layout.pillRadius, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: palette.white },
  ctaBtnText: { fontWeight: fontWeights.semiBold },

  // Transaction list
  historyTitle: { marginBottom: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  txLeft: { flex: 1, gap: spacing.xs },
  txTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txAmount: { minWidth: spacing.s48, textAlign: 'right' },

  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing.huge, alignItems: 'center' },
  footerLoader: { paddingVertical: spacing.lg, alignItems: 'center' },
});
