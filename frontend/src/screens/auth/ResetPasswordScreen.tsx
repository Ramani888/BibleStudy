import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField, OTPInput } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validators';
import { colors, spacing } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const { email } = route.params;
  const resetPassword = useAuthStore(s => s.resetPassword);
  const [resending, setResending] = useState(false);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({ email, otp: data.otp, newPassword: data.newPassword });
      Toast.show({
        type: 'success',
        text1: 'Password reset!',
        text2: 'You can now sign in with your new password.',
      });
      navigation.navigate('Login');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Reset failed',
        text2: getErrorMessage(err),
      });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.forgotPassword({ email });
      Toast.show({ type: 'success', text1: 'Code resent', text2: 'Check your inbox.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not resend', text2: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="New password"
      subtitle={`Enter the code sent to ${email} and choose a new password`}
      footer={
        <Pressable onPress={handleResend} disabled={resending}>
          <Typography preset="label" color={resending ? colors.textDisabled : colors.primary}>
            {resending ? 'Sending…' : 'Resend code'}
          </Typography>
        </Pressable>
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

      <FormField
        name="newPassword"
        control={control}
        label="New password"
        placeholder="Min 8 chars, 1 uppercase, 1 number"
        isPassword
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />

      <FormField
        name="confirmPassword"
        control={control}
        label="Confirm password"
        placeholder="Repeat your new password"
        isPassword
        inputRef={confirmRef}
        returnKeyType="done"
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <Button
        label="Reset Password"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </AuthLayout>
  );
}
