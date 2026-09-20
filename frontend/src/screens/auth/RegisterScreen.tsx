import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Checkbox, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { registerSchema, type RegisterFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import { storage } from '../../utils/storage';
import { googleStatusCodes } from '../../utils/socialAuth';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const register        = useAuthStore(s => s.register);
  const loginWithGoogle  = useAuthStore(s => s.loginWithGoogle);
  const loginWithApple   = useAuthStore(s => s.loginWithApple);
  const emailRef        = useRef<TextInput>(null);
  const passwordRef     = useRef<TextInput>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [agreed, setAgreed] = useState(false);

  const requireConsent = useCallback(() => {
    if (agreed) return true;
    Toast.show({ type: 'info', text1: t('auth:mustAgreeToTerms', 'Please agree to the Terms of Service and Privacy Policy to continue.') });
    return false;
  }, [agreed, t]);

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    await storage.setTosAccepted();
    try {
      await register(data);
      Toast.show({ type: 'success', text1: t('auth:registerSuccess', 'Account created!'), text2: t('auth:checkEmailForCode', 'Check your email for a verification code.') });
      navigation.navigate('VerifyEmail', { email: getValues('email') });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('registerFailed'), text2: getErrorMessage(err) });
    }
  };

  const handleGoogle = useCallback(async () => {
    if (!requireConsent()) return;
    await storage.setTosAccepted();
    setSocialLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== googleStatusCodes.SIGN_IN_CANCELLED) {
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

  return (
    <AuthLayout
      title={t('createAccountTitle')}
      subtitle={t('createAccountSubtitle')}
      onGoogle={handleGoogle}
      onApple={handleApple}
      socialLoading={socialLoading}
      footer={
        <>
          <View style={styles.consentRow}>
            <Checkbox value={agreed} onValueChange={setAgreed} accessibilityLabel={t('auth:agreeToTerms', 'I agree to the')} />
            <Typography preset="caption" color={colors.textSecondary} style={styles.consentText}>
              {t('auth:agreeToTerms', 'I agree to the')}{' '}
              <Typography preset="caption" color={colors.accent} onPress={() => navigation.navigate('TermsOfService')}>{t('termsOfService')}</Typography>
              {' '}{t('and')}{' '}
              <Typography preset="caption" color={colors.accent} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('privacyPolicy')}</Typography>
            </Typography>
          </View>

          <Button label={t('signUp')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!agreed} fullWidth />

          <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={colors.textSecondary} align="center">
              {t('alreadyHaveAccount')}{' '}
              <Typography preset="bodySm" color={colors.accent}>{t('signIn')}</Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View>
        <FormField
          name="name"
          control={control}
          label={t('name')}
          placeholder={t('namePlaceholder')}
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </View>
      <View>
        <FormField
          name="email"
          control={control}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
          returnKeyType="next"
          inputRef={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>
      <View>
        <FormField
          name="password"
          control={control}
          label={t('password')}
          placeholder={t('auth:validation.passwordPlaceholder', 'Min 8 chars, 1 uppercase, 1 number')}
          isPassword
          inputRef={passwordRef}
          returnKeyType="done"
          onSubmitEditing={handleSubmit(onSubmit)}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  linkPressed: { opacity: 0.7 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  consentText: { flex: 1 },
});
