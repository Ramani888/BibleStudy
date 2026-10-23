import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { QMBackButton, QMEmpty, QMSegmented, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { ArrowUpIcon, CreditIcon, InfoIcon } from '../../components/icons';
import { useAchievements, useCreditBalance, useCreditTransactions, useReferral, useWeeklyChart, type SimplePeriod } from '../../hooks';
import { formatDateWithTime } from '../../utils/formatters';
import { TIERS } from '../../types';
import { qmFont, radius, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { CreditTransaction, TransactionType } from '../../types';

// ponytail: mirrors backend ai.service CREDIT_COST (text1/cards2/image3/pdf5) — update both together.
const COST = { question: 1, cards: 2, photo: 3, pdf: 5 } as const;
const DAILY = 1;
const UP_H = 64;
const DOWN_H = 50;
const AXIS = 80;
const CHART_H = 150;
const TILE = 34;
const TILE_RADIUS = 11;
const ROW_H = 60;

const TYPE_KEY: Record<TransactionType, string> = { USAGE: 'usage', REWARD: 'reward', PURCHASE: 'purchase', BONUS: 'bonus' };

/** One day/week/month: earned grows up from the axis, used grows down. */
function Bar({ earned, used, max, on, index, usedColor, label, a11y, onPress }: {
  earned: number; used: number; max: number; on: boolean; index: number; usedColor: string; label: string; a11y: string; onPress: () => void;
}) {
  const { qm } = useTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withDelay(index * 50, withTiming(1, { duration: 700, easing: Easing.bezier(0.3, 0.9, 0.3, 1), reduceMotion: ReduceMotion.System }));
  }, [p, index, earned, used]);
  const up = useAnimatedStyle(() => ({ height: Math.round((earned / max) * UP_H) * p.value }));
  const down = useAnimatedStyle(() => ({ height: Math.round((used / max) * DOWN_H) * p.value }));
  return (
    <Pressable onPress={onPress} style={styles.barCol} accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: on }}>
      <Animated.View style={[styles.barUp, !on && styles.barOff, { backgroundColor: qm.leaf }, up]} />
      <Animated.View style={[styles.barDown, !on && styles.barOff, { backgroundColor: usedColor }, down]} />
      <Typography preset={on ? 'qmTag' : 'qmCaption'} color={on ? qm.ink : qm.muted} numberOfLines={1} style={styles.barLabel}>{label}</Typography>
    </Pressable>
  );
}

function Activity() {
  const { t } = useTranslation('profile');
  const { qm, name } = useTheme();
  const chart = useWeeklyChart('week');
  const stats = chart.safeStats;
  const max = Math.max(1, ...stats.map(d => Math.max(d.earned, d.used)));
  const pick = chart.selectedIdx ?? stats.length - 1;
  const picked = stats[pick];
  const usedColor = name === 'dark' ? qm.violet : qm.setColors[1];

  return (
    <Animated.View entering={qmRowEnter(2)} style={[styles.card, styles.activity, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
      <View style={styles.activityHead}>
        <Typography preset="qmBodyLg" color={qm.ink}>{t('qmCredits.activity')}</Typography>
        <View style={styles.range}>
          <QMSegmented<SimplePeriod>
            label={t('qmCredits.activity')}
            value={chart.period}
            onChange={chart.handlePeriod}
            options={[
              { key: 'week', label: t('qmCredits.week') },
              { key: 'month', label: t('qmCredits.month') },
              { key: 'year', label: t('qmCredits.year') },
            ]}
          />
        </View>
      </View>
      {chart.isLoading ? (
        <ActivityIndicator color={qm.violet} style={styles.chart} />
      ) : (
        <View style={styles.chart} accessibilityRole="image" accessibilityLabel={t('qmCredits.chartA11y')}>
          <View style={[styles.axis, { backgroundColor: qm.hair }]} />
          {stats.map((d, i) => (
            <Bar
              key={`${chart.period}-${d.label}-${i}`}
              index={i}
              earned={d.earned}
              used={d.used}
              max={max}
              on={i === pick}
              usedColor={usedColor}
              label={d.label}
              a11y={t('qmCredits.barA11y', { label: d.label, earned: d.earned, used: d.used })}
              onPress={() => chart.setSelectedIdx(i)}
            />
          ))}
        </View>
      )}
      {picked && (
        <View style={[styles.activityFoot, { borderTopColor: qm.hair }]}>
          <Typography preset="qmBody" color={qm.muted}>{picked.label}</Typography>
          <Typography preset="qmBody" color={qm.ink}>
            <Typography preset="qmFieldLabel" color={qm.leafText}>+{picked.earned}</Typography>
            {` ${t('qmCredits.earnedUsed')}`}
            <Typography preset="qmFieldLabel" color={qm.ink}>−{picked.used}</Typography>
            {` ${t('qmCredits.used')}`}
          </Typography>
        </View>
      )}
    </Animated.View>
  );
}

export function CreditsScreen({ navigation }: ProfileScreenProps<'Credits'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: balance } = useCreditBalance();
  const { data: achievements } = useAchievements();
  const { data: referral } = useReferral();
  const { data, isLoading, isError, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useCreditTransactions();
  const transactions = useMemo(() => data?.pages.flatMap(p => p.transactions) ?? [], [data]);

  const earn: [string, number, string, (() => void) | null][] = [
    [t('profile:qmCredits.earnDaily'), DAILY, '', null],
    [t('profile:qmCredits.earnAchievement'), achievements?.[0]?.reward ?? 5, '', () => navigation.navigate('Achievements')],
    [t('profile:qmCredits.earnInvite'), referral?.rewardPerReferral ?? 5, '', () => navigation.navigate('InviteFriends')],
    [t('profile:qmCredits.earnSubscribe'), TIERS[0].credits, t('profile:qmCredits.perMonth'), () => navigation.navigate('Paywall')],
  ];
  const costs: [string, number][] = [
    [t('profile:qmCredits.costQuestion'), COST.question],
    [t('profile:qmCredits.costCards'), COST.cards],
    [t('profile:qmCredits.costPhoto'), COST.photo],
    [t('profile:qmCredits.costPdf'), COST.pdf],
  ];

  const renderItem = useCallback(({ item, index }: { item: CreditTransaction; index: number }) => {
    const plus = item.type !== 'USAGE';
    const first = index === 0;
    const last = index === transactions.length - 1;
    return (
      <Animated.View
        entering={qmRowEnter(index)}
        style={[
          styles.txRow,
          { backgroundColor: qm.surface },
          first && styles.txFirst,
          last && styles.txLast,
        ]}
      >
        <View style={[styles.txInner, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: qm.hair }]}>
          <View style={[styles.tile, { backgroundColor: plus ? qm.leafBg : qm.lilac }]}>
            {plus ? <ArrowUpIcon size={16} color={qm.leaf} strokeWidth={2} /> : <CreditIcon size={16} color={qm.link} strokeWidth={2} />}
          </View>
          <View style={styles.flex}>
            <Typography preset="qmRow" color={qm.ink} numberOfLines={1}>{item.description}</Typography>
            <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.txMeta}>
              {t(`profile:qmCredits.types.${TYPE_KEY[item.type]}`)} · {formatDateWithTime(item.createdAt)}
            </Typography>
          </View>
          <Typography style={[styles.amt, { color: plus ? qm.leafText : qm.ink }]}>
            {plus ? '+' : '−'}{Math.abs(item.amount)}
          </Typography>
        </View>
      </Animated.View>
    );
  }, [qm, t, transactions.length]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmCredits.back')} />
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmCredits.title')}</Typography>

      <Animated.View entering={qmRowEnter(0)}>
        <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hero}>
          <Typography preset="qmLabel" color={qm.heroMuted}>{t('profile:qmCredits.youHave')}</Typography>
          <View style={styles.balanceRow}>
            <Typography style={[styles.balance, { color: qm.heroInk }]}>{balance?.balance ?? '–'}</Typography>
            <Typography preset="qmLead" color={qm.heroMuted}>{t('profile:qmCredits.credits', { count: balance?.balance ?? 0 })}</Typography>
          </View>
          <Typography preset="qmBody" color={qm.heroMuted} style={styles.daily}>{t('profile:qmCredits.daily')}</Typography>
          <AnimatedPressable
            scaleTo={0.97}
            onPress={() => navigation.navigate('Paywall')}
            style={[styles.getMore, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]}
            accessibilityRole="button"
          >
            <Typography preset="qmButton" color={qm.onViolet}>{t('profile:qmCredits.getMore')}</Typography>
          </AnimatedPressable>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={qmRowEnter(1)} style={styles.infoRow}>
        <View style={[styles.card, styles.info, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <Typography preset="qmFieldLabel" color={qm.ink}>{t('profile:qmCredits.earnTitle')}</Typography>
          <View style={styles.infoList}>
            {earn.map(([label, n, suffix, go]) => (
              <Pressable key={label} onPress={go ?? undefined} disabled={!go} hitSlop={4} style={({ pressed }) => [styles.infoLine, pressed && styles.dim]}>
                <Typography preset="qmMeta" color={qm.body} style={styles.flex} numberOfLines={1}>{label}</Typography>
                <Typography preset="qmChip" color={qm.leafText}>+{n}{suffix}</Typography>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={[styles.card, styles.info, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
          <Typography preset="qmFieldLabel" color={qm.ink}>{t('profile:qmCredits.costTitle')}</Typography>
          <View style={styles.infoList}>
            {costs.map(([label, n]) => (
              <View key={label} style={styles.infoLine}>
                <Typography preset="qmMeta" color={qm.body} style={styles.flex} numberOfLines={1}>{label}</Typography>
                <Typography preset="qmChip" color={qm.ink}>{n}</Typography>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      <Activity />

      <Typography preset="qmLabel" color={qm.muted} style={styles.section}>{t('profile:qmCredits.history')}</Typography>
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) {
    empty = <QMEmpty icon={InfoIcon} title={t('profile:qmCredits.loadFailed')} action={{ label: t('profile:qmCredits.tryAgain'), onPress: () => refetch() }} />;
  } else {
    empty = <QMEmpty icon={CreditIcon} title={t('profile:qmCredits.emptyTitle')} text={t('profile:qmCredits.emptyText')} />;
  }

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={transactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={qm.violet} style={styles.more} /> : null}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage && !isLoading}
            onRefresh={() => { Promise.all([refetch(), qc.invalidateQueries({ queryKey: ['credits'] })]).catch(() => {}); }}
            tintColor={qm.violet}
            progressViewOffset={insets.top}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.s14 },
  hero: { borderRadius: radius.lg, padding: spacing.xl },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  balance: { fontFamily: qmFont.serifDisplay, fontSize: 48, lineHeight: 54 },
  daily: { marginTop: spacing.s6 },
  getMore: { marginTop: spacing.lg, height: 46, borderRadius: radius.r12 + 2, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.r17 + 1 },
  infoRow: { flexDirection: 'row', gap: spacing.s10, marginTop: spacing.md },
  info: { flex: 1, padding: spacing.s14 },
  infoList: { marginTop: spacing.s6, gap: spacing.xs },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6, minHeight: 22 },
  activity: { marginTop: spacing.md, padding: spacing.lg, borderRadius: radius.r20 },
  activityHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  range: { width: 190 },
  chart: { flexDirection: 'row', gap: spacing.xs, height: CHART_H, marginTop: spacing.s14 },
  axis: { position: 'absolute', left: 0, right: 0, top: AXIS, height: StyleSheet.hairlineWidth },
  barCol: { flex: 1, alignItems: 'center' },
  barUp: { position: 'absolute', left: '18%', right: '18%', bottom: CHART_H - AXIS, borderTopLeftRadius: radius.r6, borderTopRightRadius: radius.r6, borderBottomLeftRadius: radius.r2, borderBottomRightRadius: radius.r2 },
  barDown: { position: 'absolute', left: '18%', right: '18%', top: AXIS + 1, borderBottomLeftRadius: radius.r6, borderBottomRightRadius: radius.r6, borderTopLeftRadius: radius.r2, borderTopRightRadius: radius.r2 },
  barOff: { opacity: 0.55 },
  barLabel: { position: 'absolute', bottom: 0 },
  activityFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  section: { marginTop: spacing.xxl, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  txRow: { paddingHorizontal: spacing.lg },
  txFirst: { borderTopLeftRadius: radius.r20, borderTopRightRadius: radius.r20 },
  txLast: { borderBottomLeftRadius: radius.r20, borderBottomRightRadius: radius.r20 },
  txInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: ROW_H },
  tile: { width: TILE, height: TILE, borderRadius: TILE_RADIUS, alignItems: 'center', justifyContent: 'center' },
  txMeta: { marginTop: spacing.s2 },
  amt: { fontFamily: qmFont.serifMedium, fontSize: 17, lineHeight: 22 },
  loading: { marginTop: spacing.xxxl },
  more: { paddingVertical: spacing.lg },
});
