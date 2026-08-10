import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import type { BillingPeriod } from '../../types';
import { TIERS } from '../../types';
import { useAuthStore } from '../../store';
import { useIapSubscriptions } from '../../hooks';
import { openManageSubscriptions } from '../../utils/iap';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { CheckCircleIcon } from '../../components/icons';
import { layout, spacing, useTheme } from '../../theme';

export function PaywallScreen({ navigation }: ProfileScreenProps<'Paywall'>) {
  const { colors } = useTheme();
  const user = useAuthStore(s => s.user);
  const currentPlan = user?.plan ?? 'FREE';
  const isSubscribed = currentPlan !== 'FREE';

  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const { buy, restore, loadProducts, processing, error } = useIapSubscriptions();

  useEffect(() => { loadProducts(); }, [loadProducts]);

  return (
    <Screen header={<ScreenHeader title="Premium" onBack={navigation.goBack} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
          <Typography preset="h4" style={styles.tagline}>Go further in your study</Typography>
          <Typography preset="body" color={colors.textSecondary} style={styles.sub}>
            More AI credits, more storage, higher limits. Cancel anytime.
          </Typography>
        </View>

        {/* Billing period toggle */}
        <View>
        <View style={[styles.toggle, { backgroundColor: colors.surfaceMuted }]}>
          {(['monthly', 'annual'] as BillingPeriod[]).map(p => {
            const active = period === p;
            return (
              <Pressable key={p} style={[styles.toggleBtn, active && { backgroundColor: colors.accent }]} onPress={() => setPeriod(p)}>
                <Typography preset="label" color={active ? colors.background : colors.textSecondary}>
                  {p === 'monthly' ? 'Monthly' : 'Annual'}
                </Typography>
                {p === 'annual' && (
                  <Typography preset="caption" color={active ? colors.background : colors.success}> · save ~33%</Typography>
                )}
              </Pressable>
            );
          })}
        </View>

        {TIERS.map(tier => {
          const opt = tier[period];
          const isCurrent = currentPlan === tier.plan;
          const benefits = [
            `${tier.credits} AI credits / month`,
            `${tier.storage} media storage`,
            `${tier.aiPerHour} AI requests / hour`,
          ];
          return (
            <View key={tier.plan} style={[styles.card, { borderColor: tier.plan === 'PRO' ? colors.accent : colors.border }]}>
              <View style={styles.cardHead}>
                <Typography preset="h4">{tier.name}</Typography>
                <Typography preset="label" color={colors.accent}>{opt.priceLabel}</Typography>
              </View>
              {benefits.map(b => (
                <View key={b} style={styles.benefit}>
                  <CheckCircleIcon size={18} color={colors.success} />
                  <Typography preset="bodySm" style={styles.benefitText}>{b}</Typography>
                </View>
              ))}
              <Button
                label={isCurrent ? 'Current Plan' : `Subscribe ${opt.priceLabel}`}
                onPress={() => buy(opt.productId)}
                disabled={isCurrent || processing}
                loading={processing}
                variant={tier.plan === 'PRO' ? 'primary' : 'outline'}
                fullWidth
                style={styles.cta}
              />
            </View>
          );
        })}
        </View>

        <View>
        {!!error && <Typography preset="bodySm" color={colors.alert} style={styles.error}>{error}</Typography>}

        <Pressable onPress={restore} disabled={processing} style={styles.link}>
          <Typography preset="label" color={colors.accent}>Restore Purchases</Typography>
        </Pressable>
        {isSubscribed && (
          <Pressable onPress={openManageSubscriptions} style={styles.link}>
            <Typography preset="label" color={colors.textSecondary}>Manage Subscription</Typography>
          </Pressable>
        )}

        <Typography preset="caption" color={colors.textSecondary} style={styles.fine}>
          Subscriptions auto-renew until cancelled. Annual plans grant a full year of credits upfront.
          Manage or cancel anytime in your {`App Store`} account settings.
        </Typography>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxxl, gap: spacing.md },
  tagline: { marginTop: spacing.sm },
  sub: { marginBottom: spacing.sm },
  toggle: { flexDirection: 'row', borderRadius: layout.cardRadius, padding: spacing.xs },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: layout.cardRadius - 2 },
  card: { borderWidth: 1.5, borderRadius: layout.cardRadius, padding: spacing.lg, gap: spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  benefitText: { flex: 1 },
  cta: { marginTop: spacing.sm },
  error: { textAlign: 'center' },
  link: { alignSelf: 'center', paddingVertical: spacing.sm },
  fine: { textAlign: 'center', marginTop: spacing.sm },
});
