import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { AuthLayout } from './components/AuthLayout';
import { Typography } from '../../components/ui';
import {
  QMBackButton, QMBanner, QMButton, QMCheckbox, QMDivider, QMFormField, QMPasswordRules, QMSocialButtons,
} from '../../components/qm';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { registerSchema, type RegisterFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import { storage } from '../../utils/storage';
import { googleStatusCodes } from '../../utils/socialAuth';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

const enter = (i: number) => FadeInUp.duration(320).delay(i * 50);

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const register        = useAuthStore(s => s.register);
  const loginWithGoogle = useAuthStore(s => s.loginWithGoogle);
  const loginWithApple  = useAuthStore(s => s.loginWithApple);
  const emailRef        = useRef<TextInput>(null);
  const passwordRef     = useRef<TextInput>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [needAgree, setNeedAgree] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);

  const { control, handleSubmit, getValues, formState: { isSubmitting, submitCount } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const pw = useWatch({ control, name: 'password' }) ?? '';

  const requireConsent = useCallback(() => {
    if (agreed) return true;
    setNeedAgree(true);
    return false;
  }, [agreed]);

  const onSubmit = async (data: RegisterFormData) => {
    setEmailTaken(false);
    await storage.setTosAccepted();
    try {
      await register(data);
      navigation.navigate('VerifyEmail', { email: getValues('email'), from: 'register' });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) { setEmailTaken(true); return; }
      Toast.show({ type: 'error', text1: t('registerFailed'), text2: getErrorMessage(err) });
    }
  };
  const onCreate = () => (requireConsent() ? handleSubmit(onSubmit)() : undefined);

  const handleGoogle = useCallback(async () => {
    if (!requireConsent()) return;
    await storage.setTosAccepted();
    setSocialLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== googleStatusCodes.SIGN_IN_CANCELLED) {
        Toast.show({ type: 'error', text1: t('googleFailed'), text2: getErrorMessage(err) });
      }
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithGoogle, requireConsent, t]);

  const handleApple = useCallback(async () => {
    if (!requireConsent()) return;
    await storage.setTosAccepted();
    setSocialLoading('apple');
    try {
      await loginWithApple();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('appleFailed'), text2: getErrorMessage(err) });
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithApple, requireConsent, t]);

  const toggleAgree = (v: boolean) => { setAgreed(v); if (v) setNeedAgree(false); };

  return (
    <AuthLayout>
      <QMBackButton onPress={() => navigation.navigate('Login')} label={t('backToSignIn')} />

      <Animated.View entering={enter(0)}>
        <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('createAccountTitle')}</Typography>
        <Typography preset="qmLead" color={qm.muted}>{t('createAccountSubtitle')}</Typography>
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.social}>
        <QMSocialButtons onGoogle={handleGoogle} onApple={handleApple} loading={socialLoading} />
      </Animated.View>

      <View style={styles.divider}><QMDivider label={t('orUseEmail')} /></View>

      <View style={styles.fields}>
        <QMFormField
          name="name"
          control={control}
          label={t('name')}
          placeholder={t('namePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <QMFormField
          name="email"
          control={control}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          inputRef={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <QMFormField
          name="password"
          control={control}
          label={t('password')}
          placeholder={t('passwordCreatePlaceholder')}
          isPassword
          autoComplete="new-password"
          inputRef={passwordRef}
          returnKeyType="done"
          hideError
          onSubmitEditing={onCreate}
        />
        <View style={styles.rules}><QMPasswordRules password={pw} failed={submitCount > 0} /></View>
      </View>

      <View style={styles.agreeRow}>
        <QMCheckbox value={agreed} onChange={toggleAgree} invalid={needAgree} label={`${t('agreeToTerms')} ${t('termsOfService')} ${t('and')} ${t('privacyPolicy')}`} />
        <Typography preset="qmBody" color={qm.muted} style={styles.flex1}>
          {t('agreeToTerms')}{' '}
          <Typography preset="qmBody" color={qm.link} style={styles.underline} onPress={() => navigation.navigate('TermsOfService')}>{t('termsOfService')}</Typography>
          {' '}{t('and')}{' '}
          <Typography preset="qmBody" color={qm.link} style={styles.underline} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('privacyPolicy')}</Typography>
        </Typography>
      </View>
      {needAgree && !agreed && (
        <Animated.View entering={FadeIn.duration(250)}>
          <Typography preset="qmError" color={qm.error} style={styles.needAgree} accessibilityRole="alert">{t('needAgree')}</Typography>
        </Animated.View>
      )}

      <QMButton
        label={t('signUp')}
        loadingLabel={t('creatingAccount')}
        loading={isSubmitting}
        off={!agreed}
        pressableWhenOff
        onPress={onCreate}
        style={styles.cta}
      />
      {emailTaken && (
        <QMBanner tone="error" style={styles.taken}>
          {t('emailTaken')}{' '}
          <Typography preset="qmLink" color={qm.link} style={styles.underline} onPress={() => navigation.navigate('Login')}>{t('signInInstead')}</Typography>
        </QMBanner>
      )}

      <Typography preset="qmLead" color={qm.muted} align="center" style={styles.switch}>
        {t('alreadyHaveAccount')}{' '}
        <Typography preset="qmLink" color={qm.link} style={styles.switchLink} onPress={() => navigation.navigate('Login')}>{t('signInLink')}</Typography>
      </Typography>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  underline: { textDecorationLine: 'underline' },
  title: { marginTop: spacing.s22, marginBottom: spacing.sm },
  social: { marginTop: spacing.xxl },
  divider: { marginVertical: spacing.s22 },
  fields: { gap: spacing.s14 },
  rules: { marginTop: -spacing.s2 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.s22 },
  needAgree: { marginTop: spacing.s10, marginLeft: spacing.huge - spacing.xs },
  cta: { marginTop: spacing.xl },
  taken: { marginTop: spacing.md },
  switch: { marginTop: spacing.s22, fontSize: 15 },
  switchLink: { fontSize: 15 },
});
