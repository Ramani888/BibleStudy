import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { QMBackButton, QMButton, QMFormField, QMPasswordRules, qmRowEnter } from '../../components/qm';
import { Typography } from '../../components/ui';
import { useChangePassword } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useAuthStore } from '../../store';
import { makeChangePasswordSchema, type ChangePasswordFormData } from '../../utils/validators';
import { spacing, useTheme } from '../../theme';

export function ChangePasswordScreen({ navigation }: ProfileScreenProps<'ChangePassword'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const hasPassword = useAuthStore(s => s.user?.hasPassword ?? true);
  const updateUser = useAuthStore(s => s.updateUser);
  const user = useAuthStore(s => s.user);
  const { mutateAsync: changePassword } = useChangePassword();
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, reset, watch, formState: { isSubmitting, submitCount } } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(makeChangePasswordSchema(hasPassword)),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const pw = watch('newPassword') ?? '';
  const confirm = watch('confirmPassword') ?? '';
  const match = confirm.length > 0 && confirm === pw;

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({ currentPassword: hasPassword ? data.currentPassword : undefined, newPassword: data.newPassword });
      if (!hasPassword && user) updateUser({ ...user, hasPassword: true });
      Toast.show({ type: 'success', text1: hasPassword ? t('profile:qmPw.changed') : t('profile:qmPw.added') });
      reset();
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('profile:qmPw.failed'), text2: getErrorMessage(err) });
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmPw.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>
          {hasPassword ? t('profile:qmPw.changeTitle') : t('profile:qmPw.addTitle')}
        </Typography>
        <Typography preset="qmBodyMd" color={qm.muted}>
          {hasPassword ? t('profile:qmPw.changeLead') : t('profile:qmPw.addLead', { email: user?.email ?? '' })}
        </Typography>

        <Animated.View entering={qmRowEnter(0)} style={styles.form}>
          {hasPassword && (
            <QMFormField
              name="currentPassword"
              control={control}
              label={t('profile:qmPw.current')}
              isPassword
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus()}
            />
          )}
          <View>
            <QMFormField
              name="newPassword"
              control={control}
              inputRef={newRef}
              label={t('profile:qmPw.new')}
              placeholder={t('profile:qmPw.newPh')}
              isPassword
              hideError
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <View style={styles.rules}><QMPasswordRules password={pw} failed={submitCount > 0} /></View>
          </View>
          <View>
            <QMFormField
              name="confirmPassword"
              control={control}
              inputRef={confirmRef}
              label={t('profile:qmPw.confirm')}
              placeholder={t('profile:qmPw.confirmPh')}
              isPassword
              hideError={confirm.length > 0}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
            {confirm.length > 0 && (
              <Animated.View entering={FadeIn.duration(250)}>
                <Typography preset="qmBody" color={match ? qm.leafText : qm.warm} style={styles.match}>
                  {match ? t('profile:qmPw.match') : t('profile:qmPw.noMatch')}
                </Typography>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: qm.glass, borderTopColor: qm.hair }]}>
        <QMButton
          label={hasPassword ? t('profile:qmPw.save') : t('profile:qmPw.add')}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          off={!match}
          pressableWhenOff
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  form: { gap: spacing.s18, marginTop: spacing.s22 },
  rules: { marginTop: spacing.s10 },
  match: { marginTop: spacing.sm },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
