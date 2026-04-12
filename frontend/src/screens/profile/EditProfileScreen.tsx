import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { FormField } from '../../components/forms';
import { Avatar, Button, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useUpdateProfile } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  bio: z.string().max(200, 'Max 200 characters').optional(),
  church: z.string().max(100, 'Max 100 characters').optional(),
});
type EditProfileForm = z.infer<typeof schema>;

export function EditProfileScreen({ navigation }: ProfileScreenProps<'EditProfile'>) {
  const user = useAuthStore(s => s.user);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const bioRef = useRef<TextInput>(null);
  const churchRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<EditProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      church: user?.church ?? '',
    },
  });

  const onSubmit = async (data: EditProfileForm) => {
    try {
      await updateProfile({
        name: data.name,
        bio: data.bio || undefined,
        church: data.church || undefined,
      });
      Toast.show({ type: 'success', text1: 'Profile updated!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: getErrorMessage(err) });
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
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <Avatar uri={user?.profileImage} name={user?.name} size="lg" />
            <Pressable onPress={() => Toast.show({ type: 'info', text1: 'Image upload coming soon' })}>
              <Typography preset="label" color={colors.primary}>
                Change Photo
              </Typography>
            </Pressable>
          </View>

          <View style={styles.form}>
            <FormField
              name="name"
              control={control}
              label="Full name"
              placeholder="Your name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
            />

            <FormField
              name="bio"
              control={control}
              label="Bio (optional)"
              placeholder="Tell us about yourself…"
              autoCapitalize="sentences"
              inputRef={bioRef}
              returnKeyType="next"
              onSubmitEditing={() => churchRef.current?.focus()}
            />

            <FormField
              name="church"
              control={control}
              label="Church (optional)"
              placeholder="Your church or congregation"
              autoCapitalize="words"
              inputRef={churchRef}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />

            <Button
              label="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  form: { gap: spacing[4] },
});
