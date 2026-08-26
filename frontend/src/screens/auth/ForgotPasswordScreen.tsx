import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { AuthLayout } from './components/AuthLayout';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { getErrorMessage } from '../../api';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../utils/validators';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import type { AuthScreenProps } from '../../navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const forgotPassword = useAuthStore(s => s.forgotPassword);

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword(data);
      Toast.show({ type: 'success', text1: t('auth:codeSent', 'Code sent'), text2: t('auth:checkEmailForResetCode', 'Check your email for a reset code.') });
      navigation.navigate('ResetPassword', { email: getValues('email') });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('auth:requestFailed', 'Request failed'), text2: getErrorMessage(err) });
    }
  };

  return (
    <AuthLayout
      title={t('forgotPasswordTitle')}
      subtitle={t('forgotPasswordSubtitle')}
      footer={
        <>
          <Button label={t('sendResetLink')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
          <Pressable onPress={() => navigation.navigate('Login')} style={({ pressed }) => pressed && styles.linkPressed}>
            <Typography preset="bodySm" color={colors.textSecondary} align="center">
              {t('alreadyHaveAccount')}{' '}
              <Typography preset="bodySm" color={colors.accent}>{t('signIn')}</Typography>
            </Typography>
          </Pressable>
        </>
      }
    >
      <View>
        <FormField
          name="email"
          control={control}
          label={t('email')}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
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
