import React, { useEffect, useMemo, useState } from 'react';
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
import { type Theme, useTheme } from '../../theme';

export function PaywallScreen({ navigation }: ProfileScreenProps<'Paywall'>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
        <View style={styles.toggle}>
          {(['monthly', 'annual'] as BillingPeriod[]).map(p => {
            const active = period === p;
            return (
              <Pressable key={p} style={[styles.toggleBtn, active && styles.toggleBtnActive]} onPress={() => setPeriod(p)}>
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
            <View key={tier.plan} style={[styles.card, tier.plan === 'PRO' && styles.cardHighlight]}>
              <View style={styles.cardHead}>
                <Typography preset="h4">{tier.name}</Typography>
                <Typography preset="label" color={colors.primary}>{opt.priceLabel}</Typography>
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
        {!!error && <Typography preset="bodySm" color={colors.error} style={styles.error}>{error}</Typography>}

        <Pressable onPress={restore} disabled={processing} style={styles.link}>
          <Typography preset="label" color={colors.primary}>Restore Purchases</Typography>
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

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[8], gap: spacing[3] },
  tagline: { marginTop: spacing[2] },
  sub: { marginBottom: spacing[2] },
  toggle: { flexDirection: 'row', backgroundColor: colors.backgroundSecondary, borderRadius: layout.cardRadius, padding: spacing[1] },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[2], borderRadius: layout.cardRadius - 2 },
  toggleBtnActive: { backgroundColor: colors.primary },
  card: { borderWidth: 1.5, borderColor: colors.border, borderRadius: layout.cardRadius, padding: spacing[4], gap: spacing[2] },
  cardHighlight: { borderColor: colors.primary },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  benefitText: { flex: 1 },
  cta: { marginTop: spacing[2] },
  error: { textAlign: 'center' },
  link: { alignSelf: 'center', paddingVertical: spacing[2] },
  fine: { textAlign: 'center', marginTop: spacing[2] },
});
