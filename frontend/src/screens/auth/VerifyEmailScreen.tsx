import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { AuthLayout } from './components/AuthLayout';
import { Typography } from '../../components/ui';
import {
  QMBackButton, QMButton, QMCodeInput, QMIconSeal, QMResendRow, useResendTimer, type CodeStatus,
} from '../../components/qm';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { spacing, useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

export function VerifyEmailScreen({ route, navigation }: AuthScreenProps<'VerifyEmail'>) {
  const { t } = useTranslation('auth');
  const { qm } = useTheme();
  const { email, from = 'register' } = route.params;
  const verifyEmail = useAuthStore(s => s.verifyEmail);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<CodeStatus>('idle');
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const { left, restart } = useResendTimer();

  const check = useCallback(async (otp: string) => {
    setChecking(true);
    try {
      await verifyEmail({ email, otp });
      setStatus('ok'); // auth state flips → RootNavigator swaps to the app
    } catch (err) {
      if (axios.isAxiosError(err) && err.response && err.response.status < 500) setStatus('bad');
      else Toast.show({ type: 'error', text1: t('verificationFailed'), text2: getErrorMessage(err) });
    } finally {
      setChecking(false);
    }
  }, [email, verifyEmail, t]);

  const onCode = (v: string) => {
    setCode(v);
    setStatus('idle');
    if (v.length === 6) check(v);
  };

  const resend = useCallback(async () => {
    setResending(true);
    try {
      await authApi.resendVerification({ email });
      setCode('');
      setStatus('idle');
      restart();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('couldNotResend'), text2: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email, restart, t]);

  return (
    <AuthLayout>
      <QMBackButton onPress={() => navigation.goBack()} label={t('back')} />

      <View style={styles.sealWrap}>
        <QMIconSeal>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path d="M5.5 5.5h13A2.5 2.5 0 0 1 21 8v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16V8a2.5 2.5 0 0 1 2.5-2.5zM3.5 7l8.5 6.5L20.5 7" stroke={qm.link} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </QMIconSeal>
        <Animated.View entering={ZoomIn.delay(500).springify().damping(10)} style={styles.leaf}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7" fill={qm.leafBg} stroke={qm.leaf} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </View>

      <Typography preset="qmDisplay" color={qm.ink} style={styles.title}>{t('verifyTitle')}</Typography>
      <Typography preset="qmLead" color={qm.muted}>
        {t('verifyLead')} <Typography preset="qmBodyLg" color={qm.ink}>{email}</Typography>
      </Typography>

      <View style={styles.code}>
        <QMCodeInput value={code} onChange={onCode} status={status} label={t('codeLabel')} autoFocus />
      </View>

      {status === 'bad' && (
        <Animated.View entering={FadeIn.duration(250)}>
          <Typography preset="qmBody" color={qm.error} style={styles.msg} accessibilityRole="alert">{t('codeBad')}</Typography>
        </Animated.View>
      )}
      {status === 'ok' && (
        <Animated.View entering={FadeIn.duration(250)}>
          <Typography preset="qmLink" color={qm.leaf} style={styles.msg}>{t('verifiedTakingIn')}</Typography>
        </Animated.View>
      )}

      <View style={styles.resend}>
        <QMResendRow left={left} onResend={resend} busy={resending} />
      </View>

      <View style={styles.flex} />

      <QMButton
        label={t('verifyBtn')}
        loadingLabel={status === 'ok' ? '' : t('checking')}
        loading={checking || status === 'ok'}
        off={code.length < 6 && !checking}
        onPress={() => code.length === 6 && check(code)}
      />
      <Typography preset="qmLead" color={qm.muted} align="center" style={styles.footer}>
        {from === 'register' && (
          <>
            {t('wrongEmail')}{' '}
            <Typography preset="qmLink" color={qm.link} onPress={() => navigation.navigate('Register')}>{t('changeIt')}</Typography>
            {' · '}
          </>
        )}
        <Typography preset="qmLink" color={qm.link} onPress={() => navigation.navigate('Login')}>{t('backToSignInLink')}</Typography>
      </Typography>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minHeight: spacing.xxl },
  sealWrap: { marginTop: spacing.s28, alignSelf: 'flex-start' },
  leaf: { position: 'absolute', right: -spacing.s6, top: -spacing.s6 },
  title: { fontSize: 30, lineHeight: 35, marginTop: spacing.s22, marginBottom: spacing.sm }, // canvas inner-screen title 30px
  code: { marginTop: spacing.s28 },
  msg: { marginTop: spacing.md },
  resend: { marginTop: spacing.xl },
  footer: { marginTop: spacing.s18, fontSize: 15 },
});
