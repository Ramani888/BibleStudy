import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import { QMBackButton, QMButton, QMFormField, QMSheet } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CameraIcon, ImageIcon, LockIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useUpdateProfile, usePickMedia } from '../../hooks';
import { getErrorMessage } from '../../api';
import { qmFont, radius, spacing, useTheme } from '../../theme';
import i18n from '../../i18n';

const PHOTO = 112;
const BADGE = 36;
const BIO_MAX = 200;
const FIELD_H = 52;

const schema = z.object({
  name: z.string().min(2, i18n.t('profile:editProfile.nameMin', 'Name must be at least 2 characters')).trim(),
  bio: z.string().max(BIO_MAX, i18n.t('common:validation.max200', 'Max 200 characters')).optional(),
  church: z.string().max(100, i18n.t('common:validation.max100', 'Max 100 characters')).optional(),
});
type EditProfileForm = z.infer<typeof schema>;

function initials(name?: string): string {
  const p = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return p.length ? (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() : '?';
}

export function EditProfileScreen({ navigation }: ProfileScreenProps<'EditProfile'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { pickImage, takePhoto, isUploading } = usePickMedia();
  const [photoSheet, setPhotoSheet] = useState(false);
  const bioRef = useRef<TextInput>(null);
  const churchRef = useRef<TextInput>(null);

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<EditProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '', church: user?.church ?? '' },
  });
  const bioLen = (watch('bio') ?? '').length;

  const handlePickPhoto = async (source: 'library' | 'camera') => {
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
      await updateProfile({ name: data.name, bio: data.bio || undefined, church: data.church || undefined });
      Toast.show({ type: 'success', text1: t('profile:qmEdit.saved') });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('profile:qmEdit.failed'), text2: getErrorMessage(err) });
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: qm.bg }]} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmEdit.back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmEdit.title')}</Typography>

        <View style={styles.photoWrap}>
          <Animated.View entering={FadeIn.duration(600)}>
            <AnimatedPressable
              scaleTo={0.97}
              onPress={() => setPhotoSheet(true)}
              disabled={isUploading}
              accessibilityRole="button"
              accessibilityLabel={t('profile:qmEdit.changePhoto')}
            >
              {user?.profileImage
                ? <Image source={{ uri: user.profileImage }} style={[styles.photo, { backgroundColor: qm.field }]} />
                : (
                  <View style={[styles.photo, styles.center, { backgroundColor: qm.lilac }]}>
                    <Typography style={[styles.initials, { color: qm.link }]}>{initials(user?.name)}</Typography>
                  </View>
                )}
              <View style={[styles.badge, { backgroundColor: qm.violet, borderColor: qm.bg }]}>
                {isUploading ? <ActivityIndicator size="small" color={qm.onViolet} /> : <CameraIcon size={17} color={qm.onViolet} strokeWidth={2} />}
              </View>
            </AnimatedPressable>
          </Animated.View>
          <Pressable onPress={() => setPhotoSheet(true)} disabled={isUploading} hitSlop={6} style={({ pressed }) => [styles.changeLink, pressed && styles.dim]}>
            <Typography preset="qmSegment" color={qm.link}>{t('profile:qmEdit.changePhoto')}</Typography>
          </Pressable>
        </View>

        <View style={styles.form}>
          <QMFormField
            name="name"
            control={control}
            label={t('profile:qmEdit.name')}
            placeholder={t('profile:qmEdit.namePh')}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => bioRef.current?.focus()}
          />
          <QMFormField
            name="bio"
            control={control}
            inputRef={bioRef}
            label={t('profile:qmEdit.bio')}
            optional={t('profile:qmEdit.optional')}
            counter={`${bioLen} / ${BIO_MAX}`}
            placeholder={t('profile:qmEdit.bioPh')}
            autoCapitalize="sentences"
            maxLength={BIO_MAX}
            multiline
            style={styles.bio}
          />
          <QMFormField
            name="church"
            control={control}
            inputRef={churchRef}
            label={t('profile:qmEdit.church')}
            optional={t('profile:qmEdit.optional')}
            placeholder={t('profile:qmEdit.churchPh')}
            autoCapitalize="words"
            maxLength={100}
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
          <View>
            <Typography preset="qmFieldLabel" color={qm.body}>{t('profile:qmEdit.email')}</Typography>
            <View style={[styles.email, { backgroundColor: qm.field }]}>
              <LockIcon size={16} color={qm.muted} strokeWidth={2} />
              <Typography preset="qmInput" color={qm.muted} numberOfLines={1} style={styles.flex}>{user?.email}</Typography>
            </View>
            <Typography preset="qmMeta" color={qm.muted} style={styles.emailNote}>{t('profile:qmEdit.emailNote')}</Typography>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: qm.glass, borderTopColor: qm.hair }]}>
        <QMButton label={t('profile:qmEdit.save')} onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
      </View>

      <QMSheet
        visible={photoSheet}
        onClose={() => setPhotoSheet(false)}
        title={t('profile:qmEdit.photoTitle')}
        actions={[
          { label: t('profile:qmEdit.fromLibrary'), icon: ImageIcon, onPress: () => handlePickPhoto('library') },
          { label: t('profile:qmEdit.takePhoto'), icon: CameraIcon, onPress: () => handlePickPhoto('camera') },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  h1: { marginTop: spacing.s6 },
  photoWrap: { alignItems: 'center', marginTop: spacing.xl },
  photo: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2 },
  initials: { fontFamily: qmFont.serifMedium, fontSize: 40, lineHeight: 48 },
  badge: {
    position: 'absolute', right: spacing.s2, bottom: spacing.s2, width: BADGE, height: BADGE, borderRadius: BADGE / 2,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  changeLink: { marginTop: spacing.sm, height: spacing.huge, justifyContent: 'center', paddingHorizontal: spacing.md },
  form: { gap: spacing.s18, marginTop: spacing.md },
  bio: { minHeight: FIELD_H + spacing.xl },
  email: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, height: FIELD_H, paddingHorizontal: spacing.lg, borderRadius: radius.md, marginTop: spacing.sm },
  emailNote: { marginTop: spacing.s6 },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
