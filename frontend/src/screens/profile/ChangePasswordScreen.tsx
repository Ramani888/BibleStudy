import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { FormField } from '../../components/forms';
import { Button } from '../../components/ui';
import { useChangePassword } from '../../hooks';
import { getErrorMessage } from '../../api';
import { changePasswordSchema, type ChangePasswordFormData } from '../../utils/validators';
import { colors, layout, spacing } from '../../theme';

export function ChangePasswordScreen({ navigation }: any) {
  const { mutateAsync: changePassword } = useChangePassword();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      Toast.show({ type: 'success', text1: 'Password changed!' });
      reset();
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err) });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField
            name="currentPassword"
            control={control}
            label="Current password"
            placeholder="Enter current password"
            isPassword
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
          />

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

          <Button
            label="Change Password"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, gap: spacing[4] },
});
