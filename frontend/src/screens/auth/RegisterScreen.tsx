import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { registerSchema, type RegisterFormData } from '../../utils/validators';
import { useTheme } from '../../theme';
import { storage } from '../../utils/storage';
import { googleStatusCodes } from '../../utils/socialAuth';
import type { AuthScreenProps } from '../../navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { colors } = useTheme();
  const register        = useAuthStore(s => s.register);
  const loginWithGoogle  = useAuthStore(s => s.loginWithGoogle);
  const loginWithApple   = useAuthStore(s => s.loginWithApple);
  const emailRef        = useRef<TextInput>(null);
  const passwordRef     = useRef<TextInput>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    await storage.setTosAccepted();
    try {
      await register(data);
      Toast.show({ type: 'success', text1: 'Account created!', text2: 'Check your email for a verification code.' });
      navigation.navigate('VerifyEmail', { email: getValues('email') });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Registration failed', text2: getErrorMessage(err) });
    }
  };

  const handleGoogle = useCallback(async () => {
    await storage.setTosAccepted();
    setSocialLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== googleStatusCodes.SIGN_IN_CANCELLED) {
        Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: getErrorMessage(err) });
      }
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithGoogle]);

  const handleApple = useCallback(async () => {
    await storage.setTosAccepted();
    setSocialLoading('apple');
    try {
      await loginWithApple();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Apple sign-in failed', text2: getErrorMessage(err) });
    } finally {
      setSocialLoading(null);
    }
  }, [loginWithApple]);

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start your Bible study journey today"
      onGoogle={handleGoogle}
      onApple={handleApple}
      socialLoading={socialLoading}
      footer={
        <>
          <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />

          <Typography preset="caption" color={colors.textSecondary} align="center">
            By creating an account, you agree to our{' '}
            <Typography preset="caption" color={colors.accent} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Typography>
            {' '}and{' '}
            <Typography preset="caption" color={colors.accent} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Typography>
          </Typography>

          <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={colors.textSecondary} align="center">
              Already have an account?{' '}
              <Typography preset="bodySm" color={colors.accent}>Sign in</Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View>
        <FormField
          name="name"
          control={control}
          label="Full name"
          placeholder="John Doe"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      </View>
      <View>
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
      </View>
      <View>
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
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  linkPressed: { opacity: 0.7 },
});
