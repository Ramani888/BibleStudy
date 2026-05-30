import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';

const SUCCESS_ANIMATION = require('../../assets/animations/success.json');
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Badge, Button, Card, Divider, Spacer, Typography } from '../../components/ui';
import { EmptyState, ErrorState } from '../../components/feedback';
import { useQueryClient } from '@tanstack/react-query';
import { useCreditBalance, useCreditTransactions, useStreak, useWatchAd } from '../../hooks';
import { WeeklyChart } from './components/WeeklyChart';
import { useRewardedAd } from '../../ads/hooks/useRewardedAd';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { colors, fontSizes, layout, spacing } from '../../theme';
import type { TransactionType } from '../../types';

const BALANCE_ICON_SIZE = 32;
const AD_ICON_SIZE = 28;

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

function BalanceCard() {
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

function WatchAdCard() {
  const [showSuccess, setShowSuccess] = useState(false);
  const { mutateAsync: claimAdReward } = useWatchAd();

  const { show: showAd, isLoaded: adLoaded, isLoading: adLoading } = useRewardedAd({
    onEarned: async () => {
      try {
        await claimAdReward();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        Toast.show({ type: 'success', text1: '+3 credits earned!', text2: 'Keep watching to earn more.' });
      } catch (err) {
        Toast.show({ type: 'error', text1: getErrorMessage(err) });
      }
    },
  });

  const isDisabled = adLoading || !adLoaded;

  return (
    <View>
      <Card style={styles.watchAdCard} shadow="sm">
        <View style={styles.watchAdRow}>
          <View style={styles.watchAdIcon}>
            <Icon name="play-circle-outline" size={AD_ICON_SIZE} color={colors.info} />
          </View>
          <View style={styles.watchAdText}>
            <Typography preset="h4" color={colors.textPrimary}>Earn Credits</Typography>
            <Typography preset="bodySm" color={colors.textSecondary}>
              Watch a short ad to earn +3 credits (up to 5×/day)
            </Typography>
          </View>
        </View>
        <Button
          label={isDisabled ? 'Loading Ad…' : 'Watch Ad'}
          onPress={showAd}
          loading={adLoading}
          variant="outline"
          fullWidth
          style={styles.watchAdBtn}
        />
      </Card>
      {showSuccess && (
        <View style={styles.successOverlay} pointerEvents="none">
          <LottieView
            source={SUCCESS_ANIMATION}
            autoPlay
            loop={false}
            style={styles.successLottie}
          />
        </View>
      )}
    </View>
  );
}

export function CreditsScreen() {
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

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
            <Spacer size={spacing[4]} />
            <WatchAdCard />
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

  // Balance card
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

  // Watch Ad card
  watchAdCard: { gap: spacing[3], backgroundColor: colors.background },
  watchAdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  watchAdIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchAdText: { flex: 1, gap: spacing[1] },
  watchAdBtn: { marginTop: spacing[1] },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successLottie: {
    width: 140,
    height: 140,
  },

  // Transaction list
  historyTitle: { marginBottom: spacing[2] },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], gap: spacing[3] },
  txLeft: { flex: 1, gap: spacing[1] },
  txDesc: { maxWidth: '90%' },
  txAmount: { minWidth: 48, textAlign: 'right' },
  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing[10], alignItems: 'center' },
  footerLoader: { paddingVertical: spacing[4], alignItems: 'center' },
});
