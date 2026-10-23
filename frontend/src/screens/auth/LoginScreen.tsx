import React, { useCallback, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AuthLayout } from './components/AuthLayout';
import { Typography } from '../../components/ui';
import {
  QMBanner, QMButton, QMDivider, QMFormField, QMLogoLockup, QMSocialButtons,
} from '../../components/qm';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import { googleStatusCodes } from '../../utils/socialAuth';
import { storage } from '../../utils/storage';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

type Banner = 'wrongPw' | 'unverified' | 'socialOnly' | 'tooMany' | 'failed' | null;
const enter = (i: number) => FadeInUp.duration(320).delay(i * 50);

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const login           = useAuthStore(s => s.login);
  const loginWithGoogle = useAuthStore(s => s.loginWithGoogle);
  const loginWithApple  = useAuthStore(s => s.loginWithApple);
  const passwordRef     = useRef<TextInput>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [banner, setBanner] = useState<Banner>(null);

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setBanner(null);
    try {
      await login(data);
      await storage.setTosAccepted();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const code = err.response.data?.error?.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          // The banner promises a fresh code, so send one; the 30s resend cooldown lives on VerifyEmail.
          authApi.resendVerification({ email: data.email }).catch(() => {});
          setBanner('unverified');
          return;
        }
        if (code === 'SOCIAL_LOGIN_ONLY') { setBanner('socialOnly'); return; }
        if (err.response.status === 429) { setBanner('tooMany'); return; }
        if (err.response.status === 401) { setBanner('wrongPw'); return; }
      }
      setBanner('failed');
    }
  };

  const handleGoogle = useCallback(async () => {
    setSocialLoading('google');
    try {
      await loginWithGoogle();
      await storage.setTosAccepted();
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== googleStatusCodes.SIGN_IN_CANCELLED) {
        Toast.show({ type: 'error', text1: t('googleFailed'), text2: getErrorMessage(err) });
      }
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithGoogle, t]);

  const handleApple = useCallback(async () => {
    setSocialLoading('apple');
    try {
      await loginWithApple();
      await storage.setTosAccepted();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('appleFailed'), text2: getErrorMessage(err) });
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithApple, t]);

  const bannerText: Record<Exclude<Banner, null>, string> = {
    wrongPw: t('bannerWrongPw'),
    unverified: t('bannerUnverified'),
    socialOnly: t('bannerSocialOnly'),
    tooMany: t('tooManyTries'),
    failed: t('bannerFailed'),
  };

  return (
    <AuthLayout>
      <Animated.View entering={enter(0)}><QMLogoLockup /></Animated.View>

      <Animated.View entering={enter(1)}>
        <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('welcomeBack')}</Typography>
        <Typography preset="qmLead" color={qm.muted}>{t('welcomeBackSubtitle')}</Typography>
      </Animated.View>

      {banner && (
        <QMBanner key={banner} tone={banner === 'wrongPw' || banner === 'tooMany' || banner === 'failed' ? 'error' : 'info'} style={styles.banner}>
          {bannerText[banner]}
          {banner === 'unverified' && (
            <>
              {' '}
              <Typography
                preset="qmLink"
                color={qm.link}
                style={styles.underline}
                onPress={() => navigation.navigate('VerifyEmail', { email: getValues('email'), from: 'login' })}
              >
                {t('enterCode')}
              </Typography>
            </>
          )}
        </QMBanner>
      )}

      <Animated.View entering={enter(2)} style={styles.social}>
        <QMSocialButtons onGoogle={handleGoogle} onApple={handleApple} loading={socialLoading} />
      </Animated.View>

      <Animated.View entering={enter(3)} style={styles.divider}>
        <QMDivider label={t('orUseEmail')} />
      </Animated.View>

      <Animated.View entering={enter(4)} style={styles.fields}>
        <QMFormField
          name="email"
          control={control}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <QMFormField
          name="password"
          control={control}
          label={t('password')}
          placeholder={t('passwordPlaceholder')}
          isPassword
          autoComplete="current-password"
          inputRef={passwordRef}
          returnKeyType="done"
          onSubmitEditing={handleSubmit(onSubmit)}
        />
        <Pressable
          onPress={() => navigation.navigate('ForgotPassword')}
          style={({ pressed }) => [styles.forgot, pressed && styles.dim]}
          accessibilityRole="link"
        >
          <Typography preset="qmLink" color={qm.link}>{t('forgotPassword')}</Typography>
        </Pressable>
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <QMButton
          label={t('signIn')}
          loadingLabel={t('signingIn')}
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.cta}
        />
        <Typography preset="qmLead" color={qm.muted} align="center" style={styles.switch}>
          {t('newToVerdance')}{' '}
          <Typography preset="qmLink" color={qm.link} style={styles.switchLink} onPress={() => navigation.navigate('Register')}>
            {t('createAnAccount')}
          </Typography>
        </Typography>
      </Animated.View>

      <View style={styles.flexSpacer} />

      <Typography preset="qmFine" color={qm.muted} align="center" style={styles.legal}>
        {t('termsAgreementWith', { names: Platform.OS === 'ios' ? t('socialNamesIos') : t('socialNamesAndroid') })}{' '}
        <Typography preset="qmFine" color={qm.link} style={styles.underline} onPress={() => navigation.navigate('TermsOfService')}>{t('termsOfService')}</Typography>
        {' '}{t('and')}{' '}
        <Typography preset="qmFine" color={qm.link} style={styles.underline} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('privacyPolicy')}</Typography>.
      </Typography>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: 0.6 },
  underline: { textDecorationLine: 'underline' },
  title: { marginTop: spacing.s38 - 2, marginBottom: spacing.sm },
  banner: { marginTop: spacing.xl },
  social: { marginTop: spacing.s28 },
  divider: { marginVertical: spacing.xxl },
  fields: { gap: spacing.s14 },
  forgot: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  cta: { marginTop: spacing.xl },
  switch: { marginTop: spacing.s22, fontSize: 15 },
  switchLink: { fontSize: 15 },
  flexSpacer: { flex: 1, minHeight: spacing.s28 },
  legal: { marginHorizontal: spacing.sm },
});
