import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import type { BillingPeriod, FreeTierDef, TierDef } from '../../types';
import { FREE_TIER, TIERS } from '../../types';
import { useAuthStore } from '../../store';
import { useIapSubscriptions } from '../../hooks';
import { openManageSubscriptions } from '../../utils/iap';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { CheckCircleIcon } from '../../components/icons';
import { CARD_FILL_LIGHT, palette, spacing, radius, layout, useTheme } from '../../theme';

type AnyTier = TierDef | FreeTierDef;

// Common features included in every paid plan — merged into the included list for paid tiers.
const PAID_COMMON = [
  'AI-powered Bible study chat',
  'Unlimited scripture card sets',
  'Spaced repetition review system',
  'PDF & image media uploads',
  'Community friends & leaderboard',
  'Study plans & group sessions',
];

function getIncludedFeatures(tier: AnyTier): string[] {
  if (tier.plan === 'FREE') return tier.benefits;
  return [...(tier as TierDef).benefits, ...PAID_COMMON];
}

// ── Radio dot ─────────────────────────────────────────────────────────────────

function Radio({ selected }: { selected: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.border }]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
    </View>
  );
}

// ── Free plan card ─────────────────────────────────────────────────────────────

function FreePlanCard({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        !isDark && !selected && styles.cardShadow,
        pressed && styles.cardPressed,
        {
          backgroundColor: isDark ? theme.colors.chipIdle : CARD_FILL_LIGHT,
          borderColor: selected ? theme.colors.accent : theme.colors.cardBorder,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <Radio selected={selected} />
      <View style={styles.planText}>
        <Typography preset="h4" color={theme.colors.textPrimary}>{t('profile:subscription.free', 'Free')}</Typography>
        <Typography preset="caption" color={theme.colors.textSecondary}>{t('profile:subscription.noCardNeeded', 'No card needed')}</Typography>
      </View>
      <Typography preset="h4" color={theme.colors.textPrimary}>$0</Typography>
    </Pressable>
  );
}

// ── Paid plan card ─────────────────────────────────────────────────────────────

function PlanCard({ tier, period, selected, onPress }: {
  tier: TierDef; period: BillingPeriod; selected: boolean; onPress: () => void;
}) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const showBadge = tier.plan === 'PRO' && period === 'annual';
  const perMonth = (tier.annualPrice / 12).toFixed(2);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        !isDark && !selected && styles.cardShadow,
        pressed && styles.cardPressed,
        {
          backgroundColor: isDark ? theme.colors.chipIdle : CARD_FILL_LIGHT,
          borderColor: selected ? theme.colors.accent : theme.colors.cardBorder,
          borderWidth: selected ? 1.5 : 1,
        },
      ]}
    >
      <Radio selected={selected} />
      <View style={styles.planText}>
        {showBadge && (
          <View style={[styles.badge, { backgroundColor: theme.colors.success }]}>
            <Typography preset="caption" color={palette.white}>{t('profile:subscription.bestValue', 'Best Value')}</Typography>
          </View>
        )}
        <Typography preset="h4" color={theme.colors.textPrimary}>{tier.name}</Typography>
        <Typography preset="caption" color={theme.colors.textSecondary}>
          {period === 'annual' ? t('profile:subscription.billedAnnually', 'Billed annually') : t('profile:subscription.billedMonthly', 'Billed monthly')}
        </Typography>
      </View>
      <View style={styles.priceBlock}>
        {period === 'annual' ? (
          <>
            <Typography preset="h4" color={theme.colors.textPrimary}>${perMonth}/mo</Typography>
            <Typography preset="caption" color={theme.colors.textSecondary}>${tier.annualPrice.toFixed(2)}/yr</Typography>
          </>
        ) : (
          <Typography preset="h4" color={theme.colors.textPrimary}>${tier.monthlyPrice.toFixed(2)}/mo</Typography>
        )}
      </View>
    </Pressable>
  );
}

// ── Included features (merged section) ────────────────────────────────────────

function IncludedSection({ tier }: { tier: AnyTier }) {
  const { t } = useTranslation(['profile', 'common']);
  const { colors } = useTheme();
  const features = getIncludedFeatures(tier);
  return (
    <View style={styles.includedSection}>
      <Typography preset="h4" color={colors.textPrimary} style={styles.includedTitle}>
        {t('profile:subscription.whatsIncluded', { name: tier.name, defaultValue: `What's included with ${tier.name}` })}
      </Typography>
      {features.map(f => (
        <View key={f} style={styles.featureRow}>
          <CheckCircleIcon size={22} color={colors.accent} />
          <Typography preset="body" color={colors.textPrimary} style={styles.featureLabel}>{f}</Typography>
        </View>
      ))}
    </View>
  );
}

import { useTranslation } from 'react-i18next';

export function PaywallScreen({ navigation }: ProfileScreenProps<'Paywall'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { colors } = useTheme();
  const user = useAuthStore(s => s.user);
  const currentPlan = user?.plan ?? 'FREE';
  const isSubscribed = currentPlan !== 'FREE';

  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [selectedTier, setSelectedTier] = useState<AnyTier>(FREE_TIER);
  const { buy, restore, loadProducts, processing, error } = useIapSubscriptions();

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const paidTier = selectedTier.plan !== 'FREE' ? (selectedTier as TierDef) : null;
  const opt = paidTier ? paidTier[period] : null;

  // Savings % for toggle — based on selected paid tier or TIERS[0] as fallback
  const savingsTier = paidTier ?? TIERS[0];
  const savingsPct = Math.round((1 - savingsTier.annualPrice / (savingsTier.monthlyPrice * 12)) * 100);

  return (
    <Screen header={<ScreenHeader title={t('profile:menu.upgradeToPremium')} onBack={navigation.goBack} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Typography preset="caption" color={colors.accent} style={styles.brand}>
            BIBLE STUDY PRO
          </Typography>
          <Typography preset="h1" color={colors.textPrimary} style={styles.heroTitle}>
            {t('profile:subscription.premium', 'Premium')}
          </Typography>
          <Typography preset="body" color={colors.textSecondary} style={styles.heroTagline}>
            {t('profile:subscription.tagline', 'Bible study is free. Credits unlock AI assistance.')}
          </Typography>
        </View>

        {/* ── Billing toggle ── */}
        <View style={[styles.toggle, { backgroundColor: colors.surfaceMuted }]}>
          {(['monthly', 'annual'] as BillingPeriod[]).map(p => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                style={({ pressed }) => [styles.toggleBtn, active && { backgroundColor: colors.accent }, pressed && styles.cardPressed]}
                onPress={() => setPeriod(p)}
              >
                <Typography preset="label" color={active ? palette.white : colors.textSecondary}>
                  {p === 'monthly' ? t('profile:paywall.monthly', 'Monthly') : t('profile:paywall.annual', 'Annual')}
                </Typography>
                {p === 'annual' && (
                  <Typography preset="caption" color={active ? palette.white : colors.success}>
                    {t('profile:paywall.savePct', { pct: savingsPct, defaultValue: ` · save ${savingsPct}%` })}
                  </Typography>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Plan cards ── */}
        <View style={styles.plans}>
          <FreePlanCard
            selected={selectedTier.plan === 'FREE'}
            onPress={() => setSelectedTier(FREE_TIER)}
          />
          {TIERS.map(tier => (
            <PlanCard
              key={tier.plan}
              tier={tier}
              period={period}
              selected={selectedTier.plan === tier.plan}
              onPress={() => setSelectedTier(tier)}
            />
          ))}
        </View>

        {/* ── Merged included features ── */}
        <IncludedSection tier={selectedTier} />

        {/* ── CTA ── */}
        <View style={styles.cta}>
          {!!error && (
            <Typography preset="caption" color={colors.alert} style={styles.errorText}>{error}</Typography>
          )}
          <Button
            label={
              selectedTier.plan === 'FREE' ? t('profile:subscription.freePlan', 'Free Plan') :
              currentPlan === selectedTier.plan ? t('profile:subscription.currentPlan', 'Current Plan') :
              t('profile:subscription.subscribePrice', { price: opt!.priceLabel, defaultValue: `Subscribe · ${opt!.priceLabel}` })
            }
            onPress={() => opt && buy(opt.productId)}
            disabled={selectedTier.plan === 'FREE' || currentPlan === selectedTier.plan || processing}
            loading={processing}
            variant="primary"
            fullWidth
          />
          {paidTier && opt && (
            <Typography preset="caption" color={colors.textSecondary} style={styles.finePrint}>
              {period === 'annual'
                ? t('profile:paywall.billedAnnuallyFinePrint', { total: paidTier.annualPrice.toFixed(2), monthlyTotal: (paidTier.monthlyPrice * 12).toFixed(2), defaultValue: `Billed $${paidTier.annualPrice.toFixed(2)} annually (vs $${(paidTier.monthlyPrice * 12).toFixed(2)} monthly). Renews until cancelled.` })
                : t('profile:paywall.billedMonthlyFinePrint', { price: paidTier.monthlyPrice.toFixed(2), defaultValue: `Billed $${paidTier.monthlyPrice.toFixed(2)} monthly. Renews until cancelled.` })}
            </Typography>
          )}
        </View>

        {/* ── Links ── */}
        <View style={styles.links}>
          <Pressable onPress={restore} disabled={processing} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="label" color={colors.accent}>{t('profile:subscription.restore', 'Restore Purchases')}</Typography>
          </Pressable>
          {isSubscribed && (
            <Pressable onPress={openManageSubscriptions} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
              <Typography preset="label" color={colors.textSecondary}>{t('profile:subscription.manage', 'Manage Subscription')}</Typography>
            </Pressable>
          )}
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.linkUnderline}>{t('profile:legal.terms', 'Terms of Use')}</Typography>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://zen2-privacy-policy.surge.sh')} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.linkUnderline}>{t('profile:legal.privacy', 'Privacy Policy')}</Typography>
          </Pressable>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.sm,
    paddingBottom: spacing.s48,
  },

  // Hero
  hero: { alignItems: 'center', marginTop: spacing.md },
  brand: { letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { marginTop: spacing.s2, textAlign: 'center' },
  heroTagline: { fontStyle: 'italic', marginTop: spacing.s6, textAlign: 'center' },

  // Toggle
  toggle: {
    flexDirection: 'row',
    borderRadius: layout.cardRadius,
    padding: spacing.xs,
    marginTop: spacing.xxl,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: layout.cardRadius - 2,
  },

  // Plan cards
  plans: { marginTop: spacing.xxl, gap: spacing.lg },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.r20,
    paddingHorizontal: spacing.s18,
    paddingVertical: spacing.s18,
    gap: spacing.s14,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  planText: { flex: 1, gap: spacing.xs },
  priceBlock: { alignItems: 'flex-end', gap: spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.s6,
  },

  // Radio
  radio: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.r12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: radius.r6 }, // ponytail: off-grid Figma value
  cardPressed: { opacity: 0.7 },

  // Merged included section
  includedSection: { marginTop: spacing.s28 },
  includedTitle: { marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  featureLabel: { flex: 1 },

  // CTA
  cta: { marginTop: spacing.xxxl, gap: spacing.md },
  errorText: { textAlign: 'center' },
  finePrint: { textAlign: 'center' },

  // Links
  links: { alignItems: 'center', marginTop: spacing.xl, gap: spacing.xs },
  link: { paddingVertical: spacing.sm },
  linkUnderline: { textDecorationLine: 'underline' },
});
