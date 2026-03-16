import React from 'react';
import { Pressable } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validators';
import { colors } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const forgotPassword = useAuthStore(s => s.forgotPassword);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data);
      Toast.show({
        type: 'success',
        text1: 'Code sent',
        text2: 'Check your email for a reset code.',
      });
      navigation.navigate('ResetPassword', { email: getValues('email') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Request failed',
        text2: getErrorMessage(err),
      });
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset code"
      footer={
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Typography preset="body" color={colors.textSecondary}>
            Remember your password?{' '}
            <Typography preset="body" color={colors.primary}>
              Sign in
            </Typography>
          </Typography>
        </Pressable>
      }
    >
      <FormField
        name="email"
        control={control}
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <Button
        label="Send Reset Code"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </AuthLayout>
  );
}
