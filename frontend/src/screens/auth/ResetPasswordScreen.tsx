import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField, OTPInput } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { authApi, getErrorMessage } from '../../api';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function ResetPasswordScreen({ route, navigation }: AuthScreenProps<'ResetPassword'>) {
  const { colors } = useTheme();
  const { email }       = route.params;
  const resetPassword   = useAuthStore(s => s.resetPassword);
  const confirmRef      = useRef<TextInput>(null);
  const [resending, setResending] = useState(false);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = useCallback(async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({ email, otp: data.otp, newPassword: data.newPassword });
      Toast.show({ type: 'success', text1: 'Password reset!', text2: 'You can now sign in with your new password.' });
      navigation.navigate('Login');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Reset failed', text2: getErrorMessage(err) });
    }
  }, [email, resetPassword, navigation]);

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      await authApi.forgotPassword({ email });
      Toast.show({ type: 'success', text1: 'Code resent', text2: 'Check your inbox.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not resend', text2: getErrorMessage(err) });
    } finally {
      setResending(false);
    }
  }, [email]);

  const subtitle = useMemo(() => `Enter the code sent to ${email} and choose a new password`, [email]);

  return (
    <AuthLayout
      title="New password"
      subtitle={subtitle}
      footer={
        <>
          <Button label="Reset Password" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
          <Pressable onPress={handleResend} disabled={resending} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={resending ? colors.textDisabled : colors.accent} align="center">
              {resending ? 'Sending…' : 'Resend code'}
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
      <View>
        <FormField
          name="newPassword"
          control={control}
          label="New password"
          placeholder="Min 8 chars, 1 uppercase, 1 number"
          isPassword
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
      </View>
      <View>
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
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  codeContainer: { gap: spacing.sm },
  linkPressed: { opacity: 0.7 },
});
