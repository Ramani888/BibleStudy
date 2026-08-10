import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
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
import { fontSizes, fontWeights, layout, shadows, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { TransactionType } from '../../types';

const TYPE_CONFIG: Record<TransactionType, { label: string; variant: 'error' | 'success' | 'info' | 'primary'; sign: string }> = {
  USAGE:    { label: 'Used',     variant: 'error',   sign: '−' },
  REWARD:   { label: 'Reward',   variant: 'success', sign: '+' },
  PURCHASE: { label: 'Purchase', variant: 'info',    sign: '+' },
  BONUS:    { label: 'Bonus',    variant: 'primary', sign: '+' },
};

function BalanceCard({ onGetMore }: { onGetMore: () => void }) {
  const { colors } = useTheme();
  const { data, isLoading } = useCreditBalance();
  const { data: streakData } = useStreak();
  const streak = streakData?.streak ?? 0;

  return (
    <View style={styles.balanceCard}>
      <LinearGradient
        colors={['#5D03FF', '#6366F1', '#8B5CF6']}
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
            <Typography preset="caption" color="#fff">🔥 {streak}</Typography>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.balanceRow}>
          <StarIcon size={28} color="rgba(255,255,255,0.9)" />
          <Typography preset="h2" color="#fff" style={styles.balanceAmount}>
            {data?.balance ?? 0}
          </Typography>
          <Typography preset="bodyLg" color="rgba(255,255,255,0.7)">credits</Typography>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        onPress={onGetMore}
      >
        <Typography preset="label" style={styles.ctaBtnText}>Get More Credits</Typography>
      </Pressable>
    </View>
  );
}

export function CreditsScreen({ navigation }: ProfileScreenProps<'Credits'>) {
  const { colors } = useTheme();
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

  const transactions = data?.pages.flatMap(p => p.transactions) ?? [];

  const amountColor: Record<TransactionType, string> = {
    USAGE:    colors.error,
    REWARD:   colors.success,
    PURCHASE: colors.info,
    BONUS:    colors.primary,
  };

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
            <View>
              <BalanceCard onGetMore={() => navigation.navigate('Paywall')} />
            </View>
            <Spacer size={spacing[4]} />
            <View>
              <WeeklyChart />
            </View>
            <Spacer size={spacing[6]} />
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
  // Single source of horizontal spacing — everything inside FlatList inherits this
  list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },

  // Balance card — no extra marginHorizontal, list padding handles alignment
  balanceCard: {
    borderRadius: layout.cardRadiusLg,
    overflow: 'hidden',
    padding: spacing[5],
    gap: spacing[4],
    ...shadows.lg,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { letterSpacing: 1, fontSize: fontSizes.xs },
  streakPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: layout.pillRadius,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  balanceAmount: { fontWeight: fontWeights.bold },
  ctaBtn: {
    backgroundColor: '#fff',
    borderRadius: layout.cardRadius,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  ctaBtnText: { color: '#6366F1', fontWeight: fontWeights.semiBold },

  historyTitle: { marginBottom: spacing[3] },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  txLeft: { flex: 1, gap: spacing[1] },
  txTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txAmount: { minWidth: 48, textAlign: 'right' },

  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing[10], alignItems: 'center' },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
});
