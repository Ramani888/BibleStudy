import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthLayout } from './components/AuthLayout';
import { Typography } from '../../components/ui';
import {
  QMBackButton, QMButton, QMCodeInput, QMFormField, QMPasswordRules, QMResendRow, useResendTimer,
} from '../../components/qm';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const { email } = route.params;
  const resetPassword = useAuthStore(s => s.resetPassword);
  const confirmRef = useRef<TextInput>(null);
  const [codeBad, setCodeBad] = useState(false);
  const [resending, setResending] = useState(false);
  const { left, restart } = useResendTimer();

  const { control, handleSubmit, setValue, formState: { isSubmitting, submitCount } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });
  const pw = useWatch({ control, name: 'newPassword' }) ?? '';
  const confirm = useWatch({ control, name: 'confirmPassword' }) ?? '';
  const mismatch = confirm.length > 0 && confirm !== pw;

  const onSubmit = useCallback(async (data: ResetPasswordFormData) => {
    setCodeBad(false);
    try {
      await resetPassword({ email, otp: data.otp, newPassword: data.newPassword });
      Toast.show({ type: 'success', text1: t('passwordResetSuccess'), text2: t('canSignInNow') });
      navigation.navigate('Login');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response && err.response.status < 500) { setCodeBad(true); return; }
      Toast.show({ type: 'error', text1: t('resetFailed'), text2: getErrorMessage(err) });
    }
  }, [email, resetPassword, navigation, t]);

  const resend = useCallback(async () => {
    setResending(true);
    try {
      await authApi.forgotPassword({ email });
      setValue('otp', '');
      setCodeBad(false);
      restart();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('couldNotResend'), text2: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email, restart, setValue, t]);

  return (
    <AuthLayout>
      <QMBackButton onPress={() => navigation.goBack()} label={t('back')} />

      <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('resetTitle')}</Typography>
      <Typography preset="qmLead" color={qm.muted}>
        {t('resetLeadA')} <Typography preset="qmBodyLg" color={qm.ink}>{email}</Typography>{t('resetLeadB')}
      </Typography>

      <Typography preset="qmFieldLabel" color={qm.ink} style={styles.codeLabel}>{t('sixDigitCode')}</Typography>
      <View style={styles.code}>
        <Controller
          name="otp"
          control={control}
          render={({ field: { value, onChange } }) => (
            <QMCodeInput value={value} onChange={v => { setCodeBad(false); onChange(v); }} status={codeBad ? 'bad' : 'idle'} size="md" label={t('sixDigitCode')} />
          )}
        />
      </View>
      <View style={styles.resend}><QMResendRow left={left} onResend={resend} busy={resending} small /></View>
      {codeBad && (
        <Animated.View entering={FadeIn.duration(250)}>
          <Typography preset="qmError" color={qm.error} style={styles.msg} accessibilityRole="alert">{t('resetCodeBad')}</Typography>
        </Animated.View>
      )}

      <View style={styles.pw}>
        <QMFormField
          name="newPassword"
          control={control}
          label={t('newPassword')}
          placeholder={t('newPasswordPlaceholder')}
          isPassword
          autoComplete="new-password"
          returnKeyType="next"
          hideError
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
      </View>
      <View style={styles.rules}><QMPasswordRules password={pw} failed={submitCount > 0} /></View>

      <View style={styles.confirm}>
        <QMFormField
          name="confirmPassword"
          control={control}
          label={t('confirmNewPassword')}
          placeholder={t('typeItAgain')}
          isPassword
          autoComplete="new-password"
          inputRef={confirmRef}
          returnKeyType="done"
          hideError
          onSubmitEditing={handleSubmit(onSubmit)}
        />
      </View>
      {(mismatch || (submitCount > 0 && confirm !== pw)) && (
        <Typography preset="qmError" color={qm.error} style={styles.msg} accessibilityRole="alert">{t('pwMismatch')}</Typography>
      )}
      {confirm.length > 0 && confirm === pw && (
        <Typography preset="qmError" color={qm.leaf} style={styles.msg}>{t('pwMatch')}</Typography>
      )}

      <QMButton label={t('saveNewPassword')} loadingLabel={t('saving')} loading={isSubmitting} onPress={handleSubmit(onSubmit)} style={styles.cta} />
      <Typography preset="qmLead" color={qm.muted} align="center" style={styles.footer}>
        {t('backToLead')}{' '}
        <Typography preset="qmLink" color={qm.link} onPress={() => navigation.navigate('Login')}>{t('signInLink')}</Typography>
      </Typography>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 35, marginTop: spacing.s22, marginBottom: spacing.sm }, // canvas inner-screen title 30px
  codeLabel: { marginTop: spacing.xxl },
  code: { marginTop: spacing.s6 },
  resend: { marginTop: spacing.s10 },
  msg: { marginTop: spacing.sm },
  pw: { marginTop: spacing.xl },
  rules: { marginTop: spacing.s10 },
  confirm: { marginTop: spacing.s18 },
  cta: { marginTop: spacing.s28 },
  footer: { marginTop: spacing.s18, fontSize: 15 },
});
