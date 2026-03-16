import React, { useRef } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { colors } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const login = useAuthStore(s => s.login);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // RootNavigator auto-switches to AppNavigator on isAuthenticated = true
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: getErrorMessage(err),
      });
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your study journey"
      footer={
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Typography preset="body" color={colors.textSecondary}>
            Don't have an account?{' '}
            <Typography preset="body" color={colors.primary}>
              Register
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
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <FormField
        name="password"
        control={control}
        label="Password"
        placeholder="Your password"
        isPassword
        inputRef={passwordRef}
        returnKeyType="done"
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Typography preset="label" color={colors.primary} align="right">
          Forgot password?
        </Typography>
      </Pressable>

      <Button
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </AuthLayout>
  );
}
