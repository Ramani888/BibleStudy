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
import { registerSchema, type RegisterFormData } from '../../utils/validators';
import { colors } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const register = useAuthStore(s => s.register);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Check your email for a verification code.',
      });
      navigation.navigate('VerifyEmail', { email: getValues('email') });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: getErrorMessage(err),
      });
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start your Bible study journey today"
      footer={
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Typography preset="body" color={colors.textSecondary}>
            Already have an account?{' '}
            <Typography preset="body" color={colors.primary}>
              Sign in
            </Typography>
          </Typography>
        </Pressable>
      }
    >
      <FormField
        name="name"
        control={control}
        label="Full name"
        placeholder="John Doe"
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <FormField
        name="email"
        control={control}
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        returnKeyType="next"
        inputRef={emailRef}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <FormField
        name="password"
        control={control}
        label="Password"
        placeholder="Min 8 chars, 1 uppercase, 1 number"
        isPassword
        inputRef={passwordRef}
        returnKeyType="done"
        onSubmitEditing={handleSubmit(onSubmit)}
      />

      <Button
        label="Create Account"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </AuthLayout>
  );
}
