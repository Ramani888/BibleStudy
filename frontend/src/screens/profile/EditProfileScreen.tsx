import React, { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { FormField } from '../../components/forms';
import { Avatar, Button, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CameraIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useUpdateProfile } from '../../hooks';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  bio: z.string().max(200, 'Max 200 characters').optional(),
  church: z.string().max(100, 'Max 100 characters').optional(),
});
type EditProfileForm = z.infer<typeof schema>;

export function EditProfileScreen({ navigation }: ProfileScreenProps<'EditProfile'>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
    <Screen
      keyboardAvoiding
      header={<ScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.avatarSection}
          onPress={() => Toast.show({ type: 'info', text1: 'Image upload coming soon' })}
        >
          <Avatar uri={user?.profileImage} name={user?.name} size="lg" />
          <View style={styles.cameraRow}>
            <CameraIcon size={16} color={colors.primary} />
            <Typography preset="label" color={colors.primary}>Change Photo</Typography>
          </View>
        </Pressable>

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
        </View>
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[6] },
    avatarSection: { alignItems: 'center', paddingVertical: spacing[6], gap: spacing[3] },
    cameraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    form: { gap: spacing[4] },
    footer: { padding: layout.screenPaddingH, paddingBottom: spacing[2] },
  });
}
