import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { Button, Card, Input, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useReferral, useRedeemReferral } from '../../hooks';
import { getErrorMessage } from '../../api';
import { shareToWhatsApp } from '../../utils';
import { layout, spacing, useTheme, type Theme } from '../../theme';

export function InviteFriendsScreen({ navigation }: ProfileScreenProps<'InviteFriends'>) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const { data: referral, isLoading, isError, refetch } = useReferral();
  const redeem = useRedeemReferral();
  const [codeInput, setCodeInput] = useState('');

  const code = referral?.code ?? '';
  const reward = referral?.rewardPerReferral ?? 5;
  const newUserReward = referral?.newUserReward ?? 5;

  const shareMessage = t('profile:invite.shareMessage', {
    code,
    url: `https://getverdance.com/?ref=${code}`,
    defaultValue:
      'Join me on Verdance — AI Bible-study flashcards & quizzes 📖✨ Use my code {{code}} when you sign up and we both get free credits! {{url}}',
  });

  const onCopy = () => {
    Clipboard.setString(code);
    Toast.show({ type: 'success', text1: t('profile:invite.copied', 'Code copied') });
  };

  const onShare = () => { if (code) shareToWhatsApp(shareMessage, 'referral'); };

  const onRedeem = async () => {
    const value = codeInput.trim();
    if (!value) return;
    try {
      const res = await redeem.mutateAsync(value);
      Toast.show({ type: 'success', text1: t('profile:invite.redeemed', '+{{n}} credits added!', { n: res.granted }) });
      setCodeInput('');
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
    }
  };

  return (
    <Screen
      keyboardAvoiding
      header={<ScreenHeader title={t('profile:invite.title', 'Invite friends')} onBack={() => navigation.goBack()} />}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Typography preset="h4" color={colors.textPrimary}>
          {t('profile:invite.headline', 'Give {{n}}, get {{n}} credits', { n: reward })}
        </Typography>
        <Typography preset="body" color={colors.textSecondary} style={styles.subtitle}>
          {t('profile:invite.subtitle', 'Share your code. When a friend signs up with it, you both get free credits.')}
        </Typography>

        <Card style={styles.codeCard}>
          <Typography preset="caption" color={colors.textSecondary}>{t('profile:invite.yourCode', 'Your code')}</Typography>
          {isError ? (
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Typography preset="label" color={colors.alert} style={styles.code}>
                {t('profile:invite.loadError', 'Couldn’t load — tap to retry')}
              </Typography>
            </Pressable>
          ) : (
            <Typography preset="h2" color={colors.accent} style={styles.code}>{isLoading ? '…' : code}</Typography>
          )}
          <View style={styles.codeActions}>
            <Button label={t('common:actions.copy', 'Copy')} variant="secondary" onPress={onCopy} disabled={!code} style={styles.flex} />
            <Button label={t('profile:invite.shareWhatsApp', 'Share')} onPress={onShare} disabled={!code} style={styles.flex} />
          </View>
        </Card>

        {!!referral && referral.referredCount > 0 && (
          <Typography preset="label" color={colors.textSecondary} style={styles.count}>
            {t('profile:invite.joinedCount', '{{count}} friends joined so far 🎉', { count: referral.referredCount })}
          </Typography>
        )}

        {referral && !referral.alreadyRedeemed && (
          <View style={styles.redeemSection}>
            <Typography preset="label" color={colors.textPrimary}>{t('profile:invite.gotCode', 'Got a code from a friend?')}</Typography>
            <Typography preset="caption" color={colors.textSecondary} style={styles.redeemHint}>
              {t('profile:invite.gotCodeHint', 'Enter it to get {{n}} free credits.', { n: newUserReward })}
            </Typography>
            <Input
              value={codeInput}
              onChangeText={setCodeInput}
              placeholder={t('profile:invite.enterCode', 'Enter code')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={16}
              returnKeyType="done"
              onSubmitEditing={onRedeem}
            />
            <Button
              label={t('profile:invite.applyCode', 'Apply code')}
              onPress={onRedeem}
              loading={redeem.isPending}
              disabled={!codeInput.trim()}
              fullWidth
              style={styles.applyBtn}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxl },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg },
  codeCard: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  code: { letterSpacing: 4, marginVertical: spacing.xs },
  codeActions: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  flex: { flex: 1 },
  count: { marginTop: spacing.lg, textAlign: 'center' },
  redeemSection: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.divider,
    gap: spacing.sm,
  },
  redeemHint: { marginBottom: spacing.xs },
  applyBtn: { marginTop: spacing.sm },
});
