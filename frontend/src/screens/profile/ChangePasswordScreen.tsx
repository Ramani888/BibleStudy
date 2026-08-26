import React, { useRef } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { useTranslation } from 'react-i18next';
import type { ProfileScreenProps } from '../../navigation/types';
import { FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useChangePassword } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useAuthStore } from '../../store';
import { makeChangePasswordSchema, type ChangePasswordFormData } from '../../utils/validators';
import { layout, spacing } from '../../theme';

export function ChangePasswordScreen({ navigation }: ProfileScreenProps<'ChangePassword'>) {
  const { t } = useTranslation(['profile', 'common']);
  const hasPassword = useAuthStore(s => s.user?.hasPassword ?? true);
  const updateUser = useAuthStore(s => s.updateUser);
  const user = useAuthStore(s => s.user);
  const { mutateAsync: changePassword } = useChangePassword();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(makeChangePasswordSchema(hasPassword)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: hasPassword ? data.currentPassword : undefined,
        newPassword: data.newPassword,
      });
      if (!hasPassword && user) updateUser({ ...user, hasPassword: true });
      Toast.show({ type: 'success', text1: hasPassword ? t('profile:changePassword.passwordChanged', 'Password changed!') : t('profile:changePassword.passwordAdded', 'Password added!') });
      reset();
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
    }
  };

  return (
    <Screen
      keyboardAvoiding
      header={<ScreenHeader title={t('profile:menu.changePassword')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label={t('common:actions.save')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View>
            {hasPassword && (
              <FormField
                name="currentPassword"
                control={control}
                label={t('profile:changePassword.currentPassword', 'Current password')}
                placeholder={t('profile:changePassword.currentPasswordPlaceholder', 'Enter current password')}
                isPassword
                returnKeyType="next"
                onSubmitEditing={() => newRef.current?.focus()}
              />
            )}
          </View>
          <View>
            <FormField
              name="newPassword"
              control={control}
              label={t('profile:changePassword.newPassword', 'New password')}
              placeholder={t('profile:changePassword.newPasswordPlaceholder', 'Min 8 chars, 1 uppercase, 1 number')}
              isPassword
              inputRef={newRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
          </View>
          <View>
            <FormField
              name="confirmPassword"
              control={control}
              label={t('profile:changePassword.confirmPassword', 'Confirm new password')}
              placeholder={t('profile:changePassword.confirmPasswordPlaceholder', 'Repeat new password')}
              isPassword
              inputRef={confirmRef}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxl },
  form: { gap: spacing.lg },
  footer: { padding: layout.screenPaddingH, paddingBottom: spacing.sm },
});
