import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Badge, Card, Divider, Spacer, Typography } from '../../components/ui';
import { EmptyState } from '../../components/feedback';
import { useCreditBalance, useCreditTransactions, useClaimDailyLogin } from '../../hooks';
import { getErrorMessage } from '../../api';
import { formatDate } from '../../utils/formatters';
import { colors, layout, spacing } from '../../theme';
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

function BalanceCard() {
  const { data, isLoading } = useCreditBalance();
  const { mutate: claim, isPending } = useClaimDailyLogin();

  const handleClaim = () => {
    claim(undefined, {
      onSuccess: res =>
        Toast.show({
          type: 'success',
          text1: `+${res.transaction.amount} credit claimed!`,
          text2: `Balance: ${res.balance}`,
        }),
      onError: (err: unknown) =>
        Toast.show({
          type: 'error',
          text1: 'Already claimed today',
          text2: getErrorMessage(err),
        }),
    });
  };

  return (
    <Card style={styles.balanceCard} shadow="md">
      <Typography preset="label" color={colors.primaryDark} style={styles.balanceLabel}>
        CURRENT BALANCE
      </Typography>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.balanceRow}>
          <Typography style={styles.balanceEmoji}>✦</Typography>
          <Typography preset="h1" color={colors.primary}>
            {data?.balance ?? 0}
          </Typography>
          <Typography preset="h4" color={colors.textSecondary}>credits</Typography>
        </View>
      )}
      <Pressable
        style={({ pressed }) => [styles.claimBtn, { opacity: pressed || isPending ? 0.65 : 1 }]}
        onPress={handleClaim}
        disabled={isPending}
      >
        <Typography preset="label" color={colors.primary}>
          {isPending ? 'Claiming…' : '✦ Claim daily credit (+1)'}
        </Typography>
      </Pressable>
    </Card>
  );
}

export function CreditsScreen() {
  const [page] = useState(1);
  const { data, isLoading, refetch, isFetching } = useCreditTransactions(page, 30);
  const transactions = data?.transactions ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching}
        onRefresh={refetch}
        ListHeaderComponent={
          <>
            <BalanceCard />
            <Spacer size={spacing[6]} />
            <Typography preset="h4" style={styles.historyTitle}>Transaction History</Typography>
          </>
        }
        ItemSeparatorComponent={() => <Divider marginV={0} />}
        ListEmptyComponent={
          !isLoading ? (
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
                {cfg.sign}{item.amount}
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
  balanceLabel: { letterSpacing: 1, fontSize: 11 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  balanceEmoji: { fontSize: 32, color: colors.primary, lineHeight: 44 },
  claimBtn: {
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
  },
  historyTitle: { marginBottom: spacing[2] },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], gap: spacing[3] },
  txLeft: { flex: 1, gap: spacing[1] },
  txDesc: { maxWidth: '90%' },
  txAmount: { minWidth: 48, textAlign: 'right' },
  emptyState: { minHeight: 160 },
  loadingWrap: { paddingTop: spacing[10], alignItems: 'center' },
});
