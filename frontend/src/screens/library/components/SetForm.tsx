import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { FormField } from '../../../components/forms';
import { Button, Badge, Typography, Divider } from '../../../components/ui';
import { AppModal } from '../../../components/feedback';
import { useFolders } from '../../../hooks';
import { createSetSchema, type CreateSetFormData } from '../../../utils/validators';
import { getErrorMessage } from '../../../api';
import { colors, spacing } from '../../../theme';
import type { Visibility, CardLayout, StudySet } from '../../../types';

interface SetFormProps {
  defaultValues?: Partial<StudySet>;
  onSubmit: (data: CreateSetFormData & { visibility: Visibility; layout: CardLayout; folderId?: string }) => Promise<void>;
  submitLabel?: string;
}

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: 'PRIVATE', label: 'Private', desc: 'Only you' },
  { value: 'PUBLIC', label: 'Public', desc: 'Everyone' },
  { value: 'FRIENDS', label: 'Friends', desc: 'Shared link' },
];

const LAYOUT_OPTIONS: { value: CardLayout; label: string }[] = [
  { value: 'DEFAULT', label: 'Default' },
  { value: 'MINIMAL', label: 'Minimal' },
  { value: 'DETAILED', label: 'Detailed' },
];

export function SetForm({ defaultValues, onSubmit, submitLabel = 'Save' }: SetFormProps) {
  const [visibility, setVisibility] = useState<Visibility>(defaultValues?.visibility ?? 'PRIVATE');
  const [layout, setLayout] = useState<CardLayout>(defaultValues?.layout ?? 'DEFAULT');
  const [folderId, setFolderId] = useState<string | undefined>(defaultValues?.folderId ?? undefined);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const { data: folders = [] } = useFolders();

  const selectedFolder = folders.find(f => f.id === folderId);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<CreateSetFormData>({
    resolver: zodResolver(createSetSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
    },
  });

  const handleSave = async (data: CreateSetFormData) => {
    try {
      await onSubmit({ ...data, visibility, layout, folderId });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
    }
  };

  return (
    <View style={styles.container}>
      <FormField
        name="title"
        control={control}
        label="Title"
        placeholder="e.g. Romans Study"
        autoCapitalize="sentences"
        returnKeyType="next"
      />

      <FormField
        name="description"
        control={control}
        label="Description (optional)"
        placeholder="What is this set about?"
        autoCapitalize="sentences"
      />

      {/* Folder picker */}
      <View>
        <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Folder (optional)
        </Typography>
        <Pressable style={styles.picker} onPress={() => setFolderPickerOpen(true)}>
          <Typography preset="body" color={selectedFolder ? colors.textPrimary : colors.textDisabled}>
            {selectedFolder ? selectedFolder.name : 'No folder'}
          </Typography>
          <Typography preset="body" color={colors.textSecondary}>›</Typography>
        </Pressable>
      </View>

      {/* Visibility */}
      <View>
        <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Visibility
        </Typography>
        <View style={styles.optionRow}>
          {VISIBILITY_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.optionChip, visibility === opt.value && styles.optionChipActive]}
              onPress={() => setVisibility(opt.value)}
            >
              <Typography
                preset="label"
                color={visibility === opt.value ? colors.primary : colors.textSecondary}
              >
                {opt.label}
              </Typography>
              <Typography
                preset="caption"
                color={visibility === opt.value ? colors.primaryDark : colors.textDisabled}
              >
                {opt.desc}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Layout */}
      <View>
        <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Card Layout
        </Typography>
        <View style={styles.optionRow}>
          {LAYOUT_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.layoutChip, layout === opt.value && styles.optionChipActive]}
              onPress={() => setLayout(opt.value)}
            >
              <Typography
                preset="label"
                color={layout === opt.value ? colors.primary : colors.textSecondary}
              >
                {opt.label}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label={submitLabel}
        onPress={handleSubmit(handleSave)}
        loading={isSubmitting}
        fullWidth
      />

      {/* Folder picker modal */}
      <AppModal
        visible={folderPickerOpen}
        title="Choose Folder"
        onClose={() => setFolderPickerOpen(false)}
      >
        <Pressable style={styles.folderOption} onPress={() => { setFolderId(undefined); setFolderPickerOpen(false); }}>
          <Typography preset="body" color={!folderId ? colors.primary : colors.textPrimary}>
            No folder
          </Typography>
          {!folderId && <Badge label="Selected" variant="primary" />}
        </Pressable>
        <Divider marginV={spacing[1]} />
        {folders.map(folder => (
          <React.Fragment key={folder.id}>
            <Pressable
              style={styles.folderOption}
              onPress={() => { setFolderId(folder.id); setFolderPickerOpen(false); }}
            >
              <Typography preset="body" color={folderId === folder.id ? colors.primary : colors.textPrimary}>
                📁 {folder.name}
              </Typography>
              {folderId === folder.id && <Badge label="Selected" variant="primary" />}
            </Pressable>
            <Divider marginV={spacing[1]} />
          </React.Fragment>
        ))}
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4] },
  fieldLabel: { marginBottom: spacing[1.5] },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing[4],
  },
  optionRow: { flexDirection: 'row', gap: spacing[2] },
  optionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[0.5],
    backgroundColor: colors.backgroundSecondary,
  },
  layoutChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
});
