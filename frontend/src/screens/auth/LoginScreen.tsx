import React, { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { loginSchema, type LoginFormData } from '../../utils/validators';
import { layout, spacing, useTheme, palette } from '../../theme';
import { googleStatusCodes } from '../../utils/socialAuth';
import type { AuthScreenProps } from '../../navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { colors } = useTheme();
  const login          = useAuthStore(s => s.login);
  const loginWithGoogle = useAuthStore(s => s.loginWithGoogle);
  const loginWithApple  = useAuthStore(s => s.loginWithApple);
  const passwordRef    = useRef<TextInput>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [socialOnly, setSocialOnly] = useState(false);

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSocialOnly(false);
    try {
      await login(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const code = err.response?.data?.error?.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          Toast.show({ type: 'info', text1: 'Email not verified', text2: 'Redirecting to verify your email…' });
          navigation.navigate('VerifyEmail', { email: getValues('email') });
          return;
        }
        if (code === 'SOCIAL_LOGIN_ONLY') {
          setSocialOnly(true);
          return;
        }
      }
      Toast.show({ type: 'error', text1: 'Login failed', text2: getErrorMessage(err) });
    }
  };

  const handleGoogle = useCallback(async () => {
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
      title="Welcome back"
      subtitle="Sign in to continue your study journey"
      onGoogle={handleGoogle}
      onApple={handleApple}
      socialLoading={socialLoading}
      footer={
        <>
          <Button label="Sign In" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
          <Pressable onPress={() => navigation.navigate('Register')} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={colors.textSecondary} align="center">
              Don't have an account?{' '}
              <Typography preset="bodySm" color={colors.accent}>Register</Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View>
        {socialOnly && (
          <View style={[styles.socialBanner, { backgroundColor: colors.accentSoft }]}>
            <Typography preset="bodySm" color={palette.indigo800} align="center">
              This account was created with Google. Use the "Continue with Google" button above to sign in.
            </Typography>
          </View>
        )}
        <FormField
          name="email"
          control={control}
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
      </View>
      <View>
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
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={({ pressed }) => pressed && styles.linkPressed}>
          <Typography preset="label" color={colors.accent} align="right">
            Forgot password?
          </Typography>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  socialBanner: {
    borderRadius: layout.cardRadius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkPressed: { opacity: 0.7 },
});
