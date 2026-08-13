import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { RootScreenProps } from '../../navigation/types';
import type { BillingPeriod, TierDef } from '../../types';
import { TIERS } from '../../types';
import { useAuthStore } from '../../store';
import { useIapSubscriptions } from '../../hooks';
import { openManageSubscriptions } from '../../utils/iap';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { CheckCircleIcon } from '../../components/icons';
import { CARD_FILL_LIGHT, palette, spacing, radius, layout, useTheme } from '../../theme';

const FEATURES = [
  'AI-powered Bible study chat',
  'Unlimited scripture card sets',
  'Spaced repetition review system',
  'PDF & image media uploads',
  'Community friends & leaderboard',
  'Study plans & group sessions',
];

// ── Radio dot ─────────────────────────────────────────────────────────────────

function Radio({ selected }: { selected: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.border }]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
    </View>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ tier, period, selected, onPress }: {
  tier: TierDef; period: BillingPeriod; selected: boolean; onPress: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.name === 'dark';
  const opt = tier[period];
  const showBadge = tier.plan === 'PRO' && period === 'annual';

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
            <Typography preset="caption" color={palette.white}>Best Value</Typography>
          </View>
        )}
        <Typography preset="h4" color={theme.colors.textPrimary}>{tier.name}</Typography>
        <Typography preset="caption" color={theme.colors.textSecondary}>
          {period === 'annual' ? 'Billed annually' : 'Billed monthly'}
        </Typography>
      </View>
      <Typography preset="h4" color={theme.colors.textPrimary}>{opt.priceLabel}</Typography>
    </Pressable>
  );
}

// ── Benefits panel ────────────────────────────────────────────────────────────

function BenefitsPanel({ tier }: { tier: TierDef }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.benefitsPanel, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
      <Typography preset="label" color={colors.accent} style={styles.benefitsPanelTitle}>
        What you get with {tier.name}
      </Typography>
      {tier.benefits.map(b => (
        <View key={b} style={styles.benefitRow}>
          <CheckCircleIcon size={22} color={colors.accent} />
          <Typography preset="body" color={colors.textPrimary} style={styles.benefitLabel}>{b}</Typography>
        </View>
      ))}
    </View>
  );
}

// ── Feature row ───────────────────────────────────────────────────────────────

function FeatureRow({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.featureRow}>
      <CheckCircleIcon size={22} color={colors.accent} />
      <Typography preset="body" color={colors.textPrimary} style={styles.featureLabel} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function PaywallScreen({ navigation }: RootScreenProps<'Paywall'>) {
  const { colors } = useTheme();
  const user = useAuthStore(s => s.user);
  const currentPlan = user?.plan ?? 'FREE';
  const isSubscribed = currentPlan !== 'FREE';

  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [selectedTier, setSelectedTier] = useState<TierDef>(TIERS[1]);
  const { buy, restore, loadProducts, processing, error } = useIapSubscriptions();

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const opt = selectedTier[period];

  return (
    <Screen header={<ScreenHeader title="Premium" onBack={navigation.goBack} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Typography preset="caption" color={colors.accent} style={styles.brand}>
            BIBLE STUDY PRO
          </Typography>
          <Typography preset="h1" color={colors.textPrimary} style={styles.heroTitle}>
            Premium
          </Typography>
          <Typography preset="body" color={colors.textSecondary} style={styles.heroTagline}>
            Bible study is free. Credits unlock AI assistance.
          </Typography>
        </View>

        {/* ── Free plan note ── */}
        <View style={[styles.freeBanner, { backgroundColor: colors.accentSoft, borderColor: colors.cardBorder }]}>
          <Typography preset="bodySm" color={colors.accent} style={styles.freeBannerTitle}>
            Always free, no card needed
          </Typography>
          <Typography preset="caption" color={colors.textSecondary}>
            Flashcards · Quizzes · Spaced repetition · Streaks · 1 AI credit every day
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
                  {p === 'monthly' ? 'Monthly' : 'Annual'}
                </Typography>
                {p === 'annual' && (
                  <Typography preset="caption" color={active ? palette.white : colors.success}>
                    {' '}· save ~33%
                  </Typography>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* ── Plan cards ── */}
        <View style={styles.plans}>
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

        {/* ── Selected plan benefits ── */}
        <BenefitsPanel tier={selectedTier} />

        {/* ── What's included ── */}
        <Typography preset="h4" color={colors.textPrimary} style={styles.includedTitle}>
          Everything included
        </Typography>
        {FEATURES.map(f => <FeatureRow key={f} label={f} />)}

        {/* ── CTA ── */}
        <View style={styles.cta}>
          {!!error && (
            <Typography preset="caption" color={colors.alert} style={styles.errorText}>{error}</Typography>
          )}
          <Button
            label={currentPlan === selectedTier.plan ? 'Current Plan' : `Subscribe · ${opt.priceLabel}`}
            onPress={() => buy(opt.productId)}
            disabled={currentPlan === selectedTier.plan || processing}
            loading={processing}
            variant="primary"
            fullWidth
          />
          <Typography preset="caption" color={colors.textSecondary} style={styles.finePrint}>
            {period === 'annual'
              ? `Billed ${opt.priceLabel} annually. Renews until cancelled.`
              : `Billed ${opt.priceLabel} monthly. Renews until cancelled.`}
          </Typography>
        </View>

        {/* ── Links ── */}
        <View style={styles.links}>
          <Pressable onPress={restore} disabled={processing} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="label" color={colors.accent}>Restore Purchases</Typography>
          </Pressable>
          {isSubscribed && (
            <Pressable onPress={openManageSubscriptions} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
              <Typography preset="label" color={colors.textSecondary}>Manage Subscription</Typography>
            </Pressable>
          )}
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.linkUnderline}>Terms of Use</Typography>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://zen2-privacy-policy.surge.sh')} style={({ pressed }) => [styles.link, pressed && styles.cardPressed]}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.linkUnderline}>Privacy Policy</Typography>
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

  // Free banner
  freeBanner: {
    borderWidth: 1,
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  freeBannerTitle: { fontWeight: '600' },

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
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.s6,
  },

  // Benefits panel
  benefitsPanel: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  benefitsPanelTitle: { fontWeight: '600', marginBottom: spacing.xs },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  benefitLabel: { flex: 1 },

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

  // Features
  includedTitle: { marginTop: spacing.s28 },
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
