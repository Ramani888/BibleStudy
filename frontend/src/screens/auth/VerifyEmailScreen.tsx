import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { OTPInput } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { verifyEmailSchema, type VerifyEmailFormData } from '../../utils/validators';
import { colors, spacing } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function VerifyEmailScreen({ route, navigation }: AuthScreenProps<'VerifyEmail'>) {
  const { email } = route.params;
  const verifyEmail = useAuthStore(s => s.verifyEmail);
  const [resending, setResending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { otp: '' },
  });

  const onSubmit = async (data: VerifyEmailFormData) => {
    try {
      await verifyEmail({ email, otp: data.otp });
      // RootNavigator auto-switches to AppNavigator
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: getErrorMessage(err),
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.forgotPassword({ email });
      Toast.show({
        type: 'success',
        text1: 'Code resent',
        text2: 'Check your inbox for a new code.',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not resend',
        text2: getErrorMessage(err),
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a 6-digit code to\n${email}`}
      footer={
        <>
          <Pressable onPress={handleResend} disabled={resending}>
            <Typography preset="label" color={resending ? colors.textDisabled : colors.primary}>
              {resending ? 'Sending…' : 'Resend code'}
            </Typography>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Typography preset="body" color={colors.textSecondary}>
              Back to{' '}
              <Typography preset="body" color={colors.primary}>
                Sign in
              </Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View style={{ gap: spacing[2] }}>
        <Typography preset="label" color={colors.textSecondary}>
          Verification code
        </Typography>
        <Controller
          name="otp"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <OTPInput value={value} onChange={onChange} error={error?.message} />
          )}
        />
      </View>

      <Button
        label="Verify Email"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </AuthLayout>
  );
}
