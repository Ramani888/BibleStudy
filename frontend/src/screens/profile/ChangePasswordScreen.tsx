import React, { useRef } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useChangePassword } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useAuthStore } from '../../store';
import { makeChangePasswordSchema, type ChangePasswordFormData } from '../../utils/validators';
import { layout, spacing, useTheme } from '../../theme';

export function ChangePasswordScreen({ navigation }: ProfileScreenProps<'ChangePassword'>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
      Toast.show({ type: 'success', text1: hasPassword ? 'Password changed!' : 'Password added!' });
      reset();
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err) });
    }
  };

  return (
    <Screen
      keyboardAvoiding
      header={<ScreenHeader title="Change Password" onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label="Save" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
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
                label="Current password"
                placeholder="Enter current password"
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
              label="New password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
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
              label="Confirm new password"
              placeholder="Repeat new password"
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

function makeStyles(_colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[6] },
    form: { gap: spacing[4] },
    footer: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
  });
}
