import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { ChevronRightIcon, FolderIcon, FolderOffIcon } from '../../../components/icons';
import { PRESET_COLORS, QMColorSwatches, QMFormField, QMSegmented, QMSheet, type QMSheetAction } from '../../../components/qm';
import { Typography } from '../../../components/ui';
import { useFolders } from '../../../hooks';
import { createSetSchema, type CreateSetFormData } from '../../../utils/validators';
import { getErrorMessage } from '../../../api';
import { useTheme, spacing, radius, qmAccent, qmFont } from '../../../theme';
import type { Visibility, CardLayout, StudySet } from '../../../types';

const COVER_W = 132;
const COVER_H = 162;
const COVER_STRIPE = 10;
const FIELD_H = 52;

/** Imperative handle so the screen can pin the submit button in its footer. */
export interface SetFormHandle {
  submit: () => void;
}

interface SetFormProps {
  defaultValues?: Partial<StudySet>;
  onSubmit: (data: CreateSetFormData & { visibility: Visibility; layout: CardLayout; folderId?: string | null; color?: string | null }) => Promise<void>;
  /** Notifies the parent so the footer button can show a loading state. */
  onSubmittingChange?: (submitting: boolean) => void;
}

const VISIBILITY: Visibility[] = ['PRIVATE', 'FRIENDS', 'PUBLIC'];
const LAYOUTS: CardLayout[] = ['DEFAULT', 'MINIMAL', 'DETAILED'];

export const SetForm = forwardRef<SetFormHandle, SetFormProps>(function SetForm(
  { defaultValues, onSubmit, onSubmittingChange },
  ref,
) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const [visibility, setVisibility] = useState<Visibility>(defaultValues?.visibility ?? 'PRIVATE');
  const [cardLayout, setCardLayout] = useState<CardLayout>(defaultValues?.layout ?? 'DEFAULT');
  const [folderId, setFolderId] = useState<string | null>(defaultValues?.folderId ?? null);
  const [color, setColor] = useState<string | null>(defaultValues?.color ?? null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const { data: folders = [] } = useFolders();
  const selectedFolder = folders.find(f => f.id === folderId);

  // If the stored folderId references a folder that no longer exists, clear it
  useEffect(() => {
    if (folderId && folders.length > 0 && !selectedFolder) setFolderId(null);
  }, [folderId, folders, selectedFolder]);

  const { control, handleSubmit, watch, formState: { isSubmitting } } = useForm<CreateSetFormData>({
    resolver: zodResolver(createSetSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
    },
  });
  const title = watch('title') ?? '';

  const handleSave = async (data: CreateSetFormData) => {
    try {
      await onSubmit({ ...data, visibility, layout: cardLayout, folderId, color });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
    }
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit(handleSave) }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const dark = themeName === 'dark';
  const [coverBg, coverInk] = qmAccent(qm, dark, color);
  const folderActions = useMemo<QMSheetAction[]>(() => [
    { label: t('library:folders.noFolder', 'No folder'), icon: FolderOffIcon, iconColor: qm.muted, tick: !folderId, onPress: () => setFolderId(null) },
    ...folders.map(f => ({
      label: f.name, icon: FolderIcon, iconColor: f.color ? qmAccent(qm, dark, f.color)[1] : qm.link,
      tick: folderId === f.id, onPress: () => setFolderId(f.id),
    })),
  ], [folders, folderId, qm, dark, t]);

  const visDesc = {
    PRIVATE: t('library:qm.visPrivate', 'Only you can see this set.'),
    FRIENDS: t('library:qm.visFriends', 'Your friends can see it in Friends’ sets.'),
    PUBLIC: t('library:qm.visPublic', 'Everyone can find it in Explore and add it to their library.'),
  }[visibility];

  return (
    <View>
      <View style={styles.coverWrap}>
        <View style={[styles.cover, { backgroundColor: coverBg, boxShadow: qm.cardShadow }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.coverStripe, { backgroundColor: coverInk }]} />
          <Typography preset="qmDisplay" color={coverInk} style={styles.coverInitial}>{(title.trim().charAt(0) || '?').toUpperCase()}</Typography>
          <Typography preset="qmMeta" color={coverInk} numberOfLines={2} style={styles.coverName}>{title.trim() || t('library:qm.yourSet', 'Your set')}</Typography>
        </View>
      </View>

      <View style={styles.fields}>
        <QMFormField
          name="title"
          control={control}
          label={t('library:sets.titleLabel', 'Title')}
          placeholder={t('library:qm.titlePlaceholder', 'e.g. Romans study')}
          autoCapitalize="sentences"
          returnKeyType="next"
          maxLength={200}
        />
        <QMFormField
          name="description"
          control={control}
          label={t('library:sets.description', 'Description')}
          optional={t('library:qm.optional', '(optional)')}
          placeholder={t('library:sets.descPlaceholder', 'What is this set about?')}
          autoCapitalize="sentences"
          multiline
          maxLength={1000}
          style={styles.desc}
        />

        <View style={styles.group}>
          <Typography preset="qmFieldLabel" color={qm.ink}>
            {t('library:qm.folder', 'Folder')}
            <Typography preset="qmBody" color={qm.muted}>{` ${t('library:qm.optional', '(optional)')}`}</Typography>
          </Typography>
          <Pressable
            onPress={() => setFolderPickerOpen(true)}
            style={({ pressed }) => [styles.picker, { backgroundColor: qm.surface, borderColor: qm.line }, pressed && styles.dim]}
            accessibilityRole="button"
            accessibilityLabel={`${t('library:qm.folder', 'Folder')}: ${selectedFolder?.name ?? t('library:folders.noFolder', 'No folder')}`}
          >
            <FolderIcon size={20} color={selectedFolder?.color ? qmAccent(qm, dark, selectedFolder.color)[1] : qm.muted} />
            <Typography preset="qmInput" color={selectedFolder ? qm.ink : qm.muted} style={styles.flex} numberOfLines={1}>
              {selectedFolder?.name ?? t('library:folders.noFolder', 'No folder')}
            </Typography>
            <ChevronRightIcon size={18} color={qm.muted} />
          </Pressable>
        </View>

        <View style={styles.group}>
          <Typography preset="qmFieldLabel" color={qm.ink}>
            {t('library:sets.color', 'Color')}
            <Typography preset="qmBody" color={qm.muted}>{` ${t('library:qm.optional', '(optional)')}`}</Typography>
          </Typography>
          <View style={styles.swatches}><QMColorSwatches value={color} onChange={setColor} presets={PRESET_COLORS} /></View>
        </View>

        <View style={styles.group}>
          <Typography preset="qmFieldLabel" color={qm.ink}>{t('library:qm.whoCanSee', 'Who can see it')}</Typography>
          <View style={styles.seg}>
            <QMSegmented
              label={t('library:qm.whoCanSee', 'Who can see it')}
              value={visibility}
              onChange={setVisibility}
              options={VISIBILITY.map(v => ({ key: v, label: t(`library:sets.visibility${v}`) }))}
            />
          </View>
          <Typography preset="qmMeta" color={qm.muted} style={styles.visDesc}>{visDesc}</Typography>
        </View>

        <View style={styles.group}>
          <Typography preset="qmFieldLabel" color={qm.ink}>{t('library:qm.cardLayout', 'Card layout')}</Typography>
          <View style={styles.seg}>
            <QMSegmented
              label={t('library:qm.cardLayout', 'Card layout')}
              value={cardLayout}
              onChange={setCardLayout}
              options={LAYOUTS.map(l => ({ key: l, label: t(`library:sets.layout${l}`) }))}
            />
          </View>
        </View>
      </View>

      <QMSheet
        visible={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        title={t('library:qm.chooseFolder', 'Choose a folder')}
        actions={folderActions}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  coverWrap: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.s22 },
  cover: {
    width: COVER_W, height: COVER_H, borderRadius: radius.r21 + 1, overflow: 'hidden',
    justifyContent: 'flex-end', padding: spacing.s14,
  },
  coverStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: COVER_STRIPE, opacity: 0.35 },
  coverInitial: { fontSize: 40, lineHeight: 44 },
  coverName: { marginTop: spacing.sm, fontFamily: qmFont.serif },
  fields: { gap: spacing.lg },
  desc: { minHeight: 72 }, // ponytail: canvas 3-row textarea
  group: { gap: spacing.s6 },
  picker: {
    height: FIELD_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: spacing.s10,
  },
  swatches: { marginTop: spacing.xs },
  seg: { marginTop: spacing.xs },
  visDesc: { marginTop: spacing.xs, marginHorizontal: spacing.s2 },
});
