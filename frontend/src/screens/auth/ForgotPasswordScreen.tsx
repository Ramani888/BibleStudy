import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { AuthLayout } from './components/AuthLayout';
import { Typography } from '../../components/ui';
import { QMBackButton, QMBanner, QMButton, QMFormField, QMIconSeal } from '../../components/qm';
import { useAuthStore } from '../../store';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

const enter = (i: number) => FadeInUp.duration(320).delay(i * 50);

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const forgotPassword = useAuthStore(s => s.forgotPassword);
  const [failed, setFailed] = useState(false);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFailed(false);
    try {
      await forgotPassword(data);
      navigation.navigate('ResetPassword', { email: data.email });
    } catch {
      setFailed(true);
    }
  };

  return (
    <AuthLayout>
      <QMBackButton onPress={() => navigation.navigate('Login')} label={t('backToSignIn')} />

      <View style={styles.seal}>
        <QMIconSeal>
          <Animated.View entering={ZoomIn.delay(200).springify().damping(9)}>
            <Svg width={42} height={42} viewBox="0 0 24 24" fill="none">
              <Circle cx={8} cy={15} r={4.5} stroke={qm.link} strokeWidth={1.7} />
              <Path d="M11.2 11.8L20 3M16.5 6.5l2.5 2.5M14 9l2 2" stroke={qm.link} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        </QMIconSeal>
      </View>

      <Animated.View entering={enter(1)}>
        <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('forgotTitle')}</Typography>
        <Typography preset="qmLead" color={qm.muted}>{t('forgotLead')}</Typography>
      </Animated.View>

      <Animated.View entering={enter(2)} style={styles.field}>
        <QMFormField
          name="email"
          control={control}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleSubmit(onSubmit)}
        />
      </Animated.View>
      {failed && <QMBanner tone="error" style={styles.banner}>{t('sendFailed')}</QMBanner>}

      <View style={styles.flex} />

      <QMButton label={t('sendResetCode')} loadingLabel={t('sending')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      <Typography preset="qmLead" color={qm.muted} align="center" style={styles.footer}>
        {t('backToLead')}{' '}
        <Typography preset="qmLink" color={qm.link} onPress={() => navigation.navigate('Login')}>{t('signInLink')}</Typography>
      </Typography>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: spacing.xxl },
  seal: { marginTop: spacing.s28 },
  title: { fontSize: 30, lineHeight: 35, marginTop: spacing.s22, marginBottom: spacing.sm }, // canvas inner-screen title 30px
  field: { marginTop: spacing.s28 },
  banner: { marginTop: spacing.s14 },
  footer: { marginTop: spacing.s18, fontSize: 15 },
});
