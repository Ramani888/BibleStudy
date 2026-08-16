import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { OTPInput } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { verifyEmailSchema, type VerifyEmailFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function VerifyEmailScreen({ route, navigation }: AuthScreenProps<'VerifyEmail'>) {
  const { colors } = useTheme();
  const { email }      = route.params;
  const verifyEmail    = useAuthStore(s => s.verifyEmail);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = useCallback(async (data: VerifyEmailFormData) => {
    try {
      await verifyEmail({ email, otp: data.otp });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: getErrorMessage(err) });
    }
  }, [email, verifyEmail]);

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await authApi.resendVerification({ email });
      Toast.show({ type: 'success', text1: 'Code resent', text2: 'Check your inbox.' });
      setCooldown(30);
      cooldownRef.current = setInterval(() => {
        setCooldown(s => {
          if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not resend', text2: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email]);

  const subtitle = useMemo(() => `We sent a 6-digit code to\n${email}`, [email]);

  return (
    <AuthLayout
      title="Check your email"
      subtitle={subtitle}
      footer={
        <>
          <Button label="Verify Email" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
          <Pressable onPress={handleResend} disabled={resending || cooldown > 0} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={resending || cooldown > 0 ? colors.textDisabled : colors.accent} align="center">
              {resending ? 'Sending…' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </Typography>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={colors.textSecondary} align="center">
              Back to{' '}
              <Typography preset="bodySm" color={colors.accent}>Sign in</Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View>
        <View style={styles.codeContainer}>
          <Typography preset="label" color={colors.textSecondary}>Verification code</Typography>
          <Controller
            name="otp"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <OTPInput value={value} onChange={onChange} error={error?.message} />
            )}
          />
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  codeContainer: { gap: spacing.sm },
  linkPressed: { opacity: 0.7 },
});
