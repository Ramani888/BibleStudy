import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { BillingPeriod, TierDef } from '../../types';
import { TIERS } from '../../types';
import { useAuthStore } from '../../store';
import { useIapSubscriptions, useSubscriptionStatus } from '../../hooks';
import { openManageSubscriptions, type StorePrice } from '../../lib/purchases';
import { QMButton, QMFog, QMSegmented, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CheckIcon, CloseIcon, LinkIcon } from '../../components/icons';
import { qmFont, radius, spacing, useTheme } from '../../theme';

type PriceMap = Record<string, StorePrice>;

const TERMS_URL = 'https://getverdance.com/terms.html';
const PRIVACY_URL = 'https://getverdance.com/privacy.html';
const TOUCH = 44;
const RADIO = 22;
const RADIO_ON = 7;
const TICK = 24;
const FOG_H = 440;

// Localized currency from the store's numeric price (for the annual "per month" line, which the
// store only exposes as an annual total). Falls back to bare code if Intl/currency is unavailable.
function fmtMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/** Live store price, falling back to the plans.ts USD label before the store loads. */
function priceOf(tier: TierDef, period: BillingPeriod, prices: PriceMap) {
  const live = prices[tier[period].productId];
  // Fallback is the bare USD number: priceLabel carries "/yr", and the cards/CTA add the period in words.
  const billed = live?.priceString ?? `$${(period === 'annual' ? tier.annualPrice : tier.monthlyPrice).toFixed(2)}`;
  const perMonth = period === 'annual'
    ? (live ? fmtMoney(live.price / 12, live.currencyCode) : `$${(tier.annualPrice / 12).toFixed(2)}`)
    : null;
  return { billed, perMonth };
}

function PlanCard({ tier, period, prices, selected, current, badge, onPress }: {
  tier: TierDef; period: BillingPeriod; prices: PriceMap; selected: boolean; current: boolean; badge: boolean; onPress: () => void;
}) {
  const { t } = useTranslation('profile');
  const { qm } = useTheme();
  const yearly = period === 'annual';
  const { billed, perMonth } = priceOf(tier, period, prices);
  const ring = useAnimatedStyle(() => ({ borderColor: withTiming(selected ? qm.violet : qm.hair, { duration: 250 }) }), [selected, qm]);
  return (
    <AnimatedPressable scaleTo={0.98} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Animated.View style={[styles.plan, selected ? styles.planOn : styles.planOff, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }, ring]}>
        <View style={[styles.radio, selected ? [styles.radioOn, { borderColor: qm.violet, backgroundColor: qm.surface }] : [styles.radioOff, { borderColor: qm.off }]]} />
        <View style={styles.flex}>
          <View style={styles.planName}>
            <Typography preset="qmSection" color={qm.ink}>{tier.name}</Typography>
            {badge && (
              <View style={[styles.tag, { backgroundColor: qm.goldBg }]}>
                <Typography preset="qmTag" color={qm.goldText}>{t('qmPlans.bestValue')}</Typography>
              </View>
            )}
            {current && (
              <View style={[styles.tag, { backgroundColor: qm.lilac }]}>
                <Typography preset="qmTag" color={qm.lilacInk}>{t('qmPlans.currentPlan')}</Typography>
              </View>
            )}
          </View>
          <Typography preset="qmBody" color={qm.muted} style={styles.planSub}>
            {yearly ? t('qmPlans.creditsYear', { count: (tier.credits * 12).toLocaleString() }) : t('qmPlans.creditsMonth', { count: tier.credits })}
          </Typography>
        </View>
        {/* Apple 3.1.2(c): the billed amount is the biggest price; per-month stays subordinate. */}
        <View style={styles.priceCol}>
          <Typography style={[styles.price, { color: qm.ink }]}>{billed}</Typography>
          <Typography preset="qmMeta" color={qm.muted}>{yearly ? t('qmPlans.aYear') : t('qmPlans.aMonth')}</Typography>
          {perMonth && <Typography preset="qmFine" color={qm.muted}>{t('qmPlans.aboutMonthly', { price: perMonth })}</Typography>}
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function PaywallScreen({ navigation }: ProfileScreenProps<'Paywall'>) {
  const { t, i18n } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const currentPlan = useAuthStore(s => s.user?.plan ?? 'FREE');
  const subscribed = currentPlan !== 'FREE';
  const { data: status } = useSubscriptionStatus();

  const [period, setPeriod] = useState<BillingPeriod>('annual');
  // Subscribers open on their own plan; free users on Starter (annual nudges higher retention).
  const [selected, setSelected] = useState<TierDef>(TIERS.find(x => x.plan === currentPlan) ?? TIERS[0]);
  const { buy, restore, loadProducts, processing, error, prices } = useIapSubscriptions();

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const yearly = period === 'annual';
  const opt = selected[period];
  const { billed } = priceOf(selected, period, prices);
  const savingsPct = Math.round((1 - selected.annualPrice / (selected.monthlyPrice * 12)) * 100);
  // ponytail: the current sub's billing period isn't stored client-side, so any period of the
  // current plan counts as "Your plan" — switching period goes through Manage subscription.
  const same = subscribed && selected.plan === currentPlan;

  const cta = !subscribed
    ? t(yearly ? 'profile:qmPlans.subscribeYear' : 'profile:qmPlans.subscribeMonth', { price: billed })
    : same ? t('profile:qmPlans.yourPlanCta')
      : t(yearly ? 'profile:qmPlans.switchYear' : 'profile:qmPlans.switchMonth', { name: selected.name, price: billed });
  const fine = same ? t('profile:qmPlans.fineSame') : t(yearly ? 'profile:qmPlans.fineYear' : 'profile:qmPlans.fineMonth', { price: billed });

  const currentTier = TIERS.find(x => x.plan === currentPlan);
  const renewDate = status?.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const perks = [
    // Yearly grants 12× up front, once (config/plans.ts) — not "every month".
    yearly
      ? t('profile:qmPlans.creditsYear', { count: (selected.credits * 12).toLocaleString() })
      : t('profile:qmPlans.perkCredits', { count: selected.credits }),
    t('profile:qmPlans.perkStorage', { size: selected.storage }),
    ...(selected.plan === 'PRO' ? [t('profile:qmPlans.perkRate', { count: selected.aiPerHour })] : []),
    t('profile:qmPlans.perkKeep'),
    t('profile:qmPlans.perkFree'),
  ];

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <QMFog height={FOG_H} />
        <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.topRow}>
            <AnimatedPressable
              scaleTo={0.95}
              onPress={navigation.goBack}
              style={[styles.close, { backgroundColor: qm.ghost }]}
              accessibilityRole="button"
              accessibilityLabel={t('profile:qmPlans.close')}
            >
              <CloseIcon size={18} color={qm.ink} strokeWidth={2} />
            </AnimatedPressable>
            <Pressable onPress={restore} disabled={processing} hitSlop={6} style={({ pressed }) => [styles.restore, pressed && styles.dim]} accessibilityRole="button">
              <Typography preset="qmLink" color={qm.ink}>{t('profile:qmPlans.restore')}</Typography>
            </Pressable>
          </View>
          <Animated.View entering={qmRowEnter(0)}>
            <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>
              {subscribed && currentTier ? t('profile:qmPlans.yourPlan', { name: currentTier.name }) : t('profile:qmPlans.heroTitle')}
            </Typography>
          </Animated.View>
          <Animated.View entering={qmRowEnter(1)}>
            <Typography preset="qmBodyMd" color={qm.body}>
              {!subscribed ? t('profile:qmPlans.heroLead') : renewDate ? t('profile:qmPlans.renews', { date: renewDate }) : t('profile:qmPlans.switchAny')}
            </Typography>
          </Animated.View>
        </View>

        <View style={styles.body}>
          <QMSegmented
            label={t('profile:qmPlans.billing')}
            value={period}
            onChange={setPeriod}
            options={[
              { key: 'monthly', label: t('profile:qmPlans.monthly') },
              { key: 'annual', label: `${t('profile:qmPlans.yearly')}  ·  ${t('profile:qmPlans.save', { pct: savingsPct })}` },
            ]}
          />

          <View style={styles.plans} accessibilityRole="radiogroup">
            {TIERS.map(tier => (
              <PlanCard
                key={tier.plan}
                tier={tier}
                period={period}
                prices={prices}
                selected={selected.plan === tier.plan}
                current={tier.plan === currentPlan}
                badge={tier.plan === 'PRO' && yearly && tier.plan !== currentPlan}
                onPress={() => setSelected(tier)}
              />
            ))}
          </View>

          <Typography preset="qmBarTitle" color={qm.ink} style={styles.perksTitle}>
            {t('profile:qmPlans.whatYouGet', { name: selected.name })}
          </Typography>
          <Animated.View key={selected.plan} entering={FadeIn.duration(350)} style={styles.perks}>
            {perks.map(p => (
              <View key={p} style={styles.perk}>
                <View style={[styles.tick, { backgroundColor: qm.leafBg }]}>
                  <CheckIcon size={13} color={qm.leaf} strokeWidth={3} />
                </View>
                <Typography preset="qmBodyMd" color={qm.body} style={styles.flex}>{p}</Typography>
              </View>
            ))}
          </Animated.View>

          {!subscribed && (
            <View style={[styles.freeCard, { backgroundColor: qm.field }]}>
              <Typography preset="qmFieldLabel" color={qm.ink}>{t('profile:qmPlans.freeTitle')}</Typography>
              <Typography preset="qmBody" color={qm.muted} style={styles.freeText}>{t('profile:qmPlans.freeText')}</Typography>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bar, { backgroundColor: qm.glass, borderTopColor: qm.hair, paddingBottom: insets.bottom + spacing.md }]}>
        {!!error && <Typography preset="qmError" color={qm.error} align="center" style={styles.error}>{error}</Typography>}
        <QMButton label={cta} onPress={() => buy(opt.productId)} off={same} loading={processing} />
        <Typography preset="qmFine" color={qm.muted} align="center" style={styles.fine}>{fine}</Typography>
        {subscribed && (
          <Pressable onPress={openManageSubscriptions} style={({ pressed }) => [styles.manage, pressed && styles.dim]} accessibilityRole="link">
            <Typography preset="qmLink" color={qm.link}>{t('profile:qmPlans.manage')}</Typography>
            <LinkIcon size={14} color={qm.link} strokeWidth={2} />
          </Pressable>
        )}
        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={6} accessibilityRole="link">
            <Typography preset="qmChip" color={qm.link}>{t('profile:qmPlans.terms')}</Typography>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={6} accessibilityRole="link">
            <Typography preset="qmChip" color={qm.link}>{t('profile:qmPlans.privacy')}</Typography>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  scroll: { paddingBottom: spacing.xxxl },
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, marginLeft: -spacing.s6, alignItems: 'center', justifyContent: 'center' },
  restore: { height: TOUCH, justifyContent: 'center', paddingHorizontal: spacing.s6 },
  h1: { marginTop: spacing.s14, marginBottom: spacing.s6 },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
  plans: { gap: spacing.s10, marginTop: spacing.s14 },
  plan: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s14, padding: spacing.lg, borderRadius: radius.r20 },
  planOn: { borderWidth: 2 },
  planOff: { borderWidth: 1 },
  radioOn: { borderWidth: RADIO_ON },
  radioOff: { borderWidth: 2 },
  radio: { width: RADIO, height: RADIO, borderRadius: RADIO / 2, marginTop: spacing.s2 },
  planName: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  planSub: { marginTop: spacing.s3 },
  tag: { borderRadius: radius.r6, paddingHorizontal: spacing.s7, paddingVertical: spacing.s3 },
  priceCol: { alignItems: 'flex-end' },
  price: { fontFamily: qmFont.serifMedium, fontSize: 22, lineHeight: 26 },
  perksTitle: { marginTop: spacing.xxl, marginBottom: spacing.md },
  perks: { gap: spacing.md },
  perk: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tick: { width: TICK, height: TICK, borderRadius: TICK / 2, alignItems: 'center', justifyContent: 'center' },
  freeCard: { marginTop: spacing.s22, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r17 + 1 },
  freeText: { marginTop: spacing.xs },
  bar: { paddingTop: spacing.md, paddingHorizontal: spacing.xl, borderTopWidth: StyleSheet.hairlineWidth },
  error: { marginBottom: spacing.sm },
  fine: { marginTop: spacing.sm },
  manage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s6, height: spacing.huge, marginTop: spacing.xs },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.s18, marginTop: spacing.sm },
});
