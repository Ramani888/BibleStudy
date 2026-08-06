import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { Badge, Card, Divider, Spacer, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EmptyState, ErrorState } from '../../components/feedback';
import { StarIcon } from '../../components/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCreditBalance, useCreditTransactions, useStreak } from '../../hooks';
import { WeeklyChart } from './components/WeeklyChart';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { fontSizes, layout, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { TransactionType } from '../../types';

const BALANCE_ICON_SIZE = 32;

const TYPE_CONFIG: Record<TransactionType, { label: string; variant: 'error' | 'success' | 'info' | 'primary'; sign: string }> = {
  USAGE:    { label: 'Used',     variant: 'error',   sign: '−' },
  REWARD:   { label: 'Reward',   variant: 'success', sign: '+' },
  PURCHASE: { label: 'Purchase', variant: 'info',    sign: '+' },
  BONUS:    { label: 'Bonus',    variant: 'primary', sign: '+' },
};

function BalanceCard() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { data, isLoading } = useCreditBalance();
  const { data: streakData } = useStreak();
  const streak = streakData?.streak ?? 0;

  return (
    <Card style={styles.balanceCard} shadow="md">
      <View style={styles.balanceHeader}>
        <Typography preset="label" color={colors.primaryDark} style={styles.balanceLabel}>
          CURRENT BALANCE
        </Typography>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Typography preset="label" color={colors.primary}>🔥 {streak}</Typography>
          </View>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.balanceRow}>
          <StarIcon size={BALANCE_ICON_SIZE} color={colors.primary} />
          <Typography preset="h4" color={colors.primary}>
            {data?.balance ?? 0}
          </Typography>
          <Typography preset="h4" color={colors.textSecondary}>credits</Typography>
        </View>
      )}
    </Card>
  );
}

export function CreditsScreen({ navigation }: ProfileScreenProps<'Credits'>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
                <Typography preset="caption" color={colors.textSecondary} numberOfLines={1} style={styles.txDesc}>
                  {item.description}
                </Typography>
                <Typography preset="caption" color={colors.textDisabled}>
                  {formatDate(item.createdAt)}
                </Typography>
              </View>
              <Typography preset="h4" color={amountColor[item.type]} style={styles.txAmount}>
                {cfg.sign}{Math.abs(item.amount)}
              </Typography>
            </View>
          );
        }}
      />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1 },
    list: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },

    balanceCard: { gap: spacing[3], backgroundColor: colors.background, marginTop: spacing[2] },
    balanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    balanceLabel: { letterSpacing: 1, fontSize: fontSizes.xs },
    streakBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[0.5],
      borderRadius: 12,
      backgroundColor: colors.primarySurface,
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },

    historyTitle: { marginBottom: spacing[2] },
    txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], gap: spacing[3] },
    txLeft: { flex: 1, gap: spacing[1] },
    txDesc: { maxWidth: '90%' },
    txAmount: { minWidth: 48, textAlign: 'right' },
    emptyState: { minHeight: 160 },
    loadingWrap: { paddingTop: spacing[10], alignItems: 'center' },
    footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
  });
}
