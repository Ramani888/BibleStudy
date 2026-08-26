import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { useTranslation } from 'react-i18next';
import type { ProfileScreenProps } from '../../navigation/types';
import { FormField } from '../../components/forms';
import { Avatar, Button, Typography } from '../../components/ui';
import { ActionSheet } from '../../components/feedback';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CameraIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useUpdateProfile, usePickMedia } from '../../hooks';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  bio: z.string().max(200, 'Max 200 characters').optional(),
  church: z.string().max(100, 'Max 100 characters').optional(),
});
type EditProfileForm = z.infer<typeof schema>;

export function EditProfileScreen({ navigation }: ProfileScreenProps<'EditProfile'>) {
  const { t } = useTranslation(['profile', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const user = useAuthStore(s => s.user);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { pickImage, takePhoto, isUploading } = usePickMedia();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
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

  const handlePickPhoto = async (source: 'library' | 'camera') => {
    setPhotoSheetVisible(false);
    const media = source === 'library' ? await pickImage() : await takePhoto();
    if (!media) return;
    try {
      await updateProfile({ profileImage: media.url });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const onSubmit = async (data: EditProfileForm) => {
    try {
      await updateProfile({
        name: data.name,
        bio: data.bio || undefined,
        church: data.church || undefined,
      });
      Toast.show({ type: 'success', text1: t('profile:editProfile.profileUpdated', 'Profile updated!') });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('profile:editProfile.updateFailed', 'Update failed'), text2: getErrorMessage(err) });
    }
  };

  return (
    <Screen
      edges={['top']}
      keyboardAvoiding
      header={<ScreenHeader title={t('profile:menu.editProfile')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button label={t('common:actions.save')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Pressable style={({ pressed }) => [styles.avatarSection, pressed && styles.avatarPressed]} onPress={() => setPhotoSheetVisible(true)} disabled={isUploading}>
            <Avatar uri={user?.profileImage} name={user?.name} size="lg" />
            <View style={styles.cameraRow}>
              {isUploading
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <><CameraIcon size={16} color={colors.accent} /><Typography preset="label" color={colors.accent}>{t('profile:editProfile.changePhoto', 'Change Photo')}</Typography></>
              }
            </View>
          </Pressable>
        </View>

        <ActionSheet
          visible={photoSheetVisible}
          title={t('profile:editProfile.changePhoto', 'Change Profile Photo')}
          onClose={() => setPhotoSheetVisible(false)}
          actions={[
            { label: t('profile:editProfile.chooseFromLibrary', 'Choose from Library'), iconName: 'image-outline', onPress: () => handlePickPhoto('library') },
            { label: t('profile:editProfile.takePhoto', 'Take Photo'), iconName: 'camera-outline', onPress: () => handlePickPhoto('camera') },
          ]}
        />

        <View>
          <View style={styles.form}>
            <FormField
              name="name"
              control={control}
              label={t('profile:editProfile.fullName', 'Full name')}
              placeholder={t('profile:editProfile.namePlaceholder', 'Your name')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
            />
            <FormField
              name="bio"
              control={control}
              label={t('profile:editProfile.bio', 'Bio (optional)')}
              placeholder={t('profile:editProfile.bioPlaceholder', 'Tell us about yourself…')}
              autoCapitalize="sentences"
              inputRef={bioRef}
              returnKeyType="next"
              onSubmitEditing={() => churchRef.current?.focus()}
            />
            <FormField
              name="church"
              control={control}
              label={t('profile:editProfile.church', 'Church (optional)')}
              placeholder={t('profile:editProfile.churchPlaceholder', 'Your church or congregation')}
              autoCapitalize="words"
              inputRef={churchRef}
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
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  cameraRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  form: { gap: spacing.lg },
  footer: { padding: layout.screenPaddingH, paddingBottom: spacing.sm },
  avatarPressed: { opacity: 0.85 },
});
