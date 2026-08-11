import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';

import { ChevronRightIcon, FolderIcon } from '../../../components/icons';
import { FormField } from '../../../components/forms';
import { Badge, ColorPicker, Typography, Divider } from '../../../components/ui';

import { AppModal } from '../../../components/feedback';
import { useFolders } from '../../../hooks';
import { createSetSchema, type CreateSetFormData } from '../../../utils/validators';
import { getErrorMessage } from '../../../api';
import { layout, spacing, useTheme } from '../../../theme';
import type { Visibility, CardLayout, StudySet } from '../../../types';

const ICON_SIZE = 18;

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

export const SetForm = forwardRef<SetFormHandle, SetFormProps>(function SetForm(
  { defaultValues, onSubmit, onSubmittingChange },
  ref,
) {
  const { colors } = useTheme();
  const [visibility, setVisibility] = useState<Visibility>(defaultValues?.visibility ?? 'PRIVATE');
  const [cardLayout, setCardLayout] = useState<CardLayout>(defaultValues?.layout ?? 'DEFAULT');
  const [folderId, setFolderId] = useState<string | null>(defaultValues?.folderId ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(defaultValues?.color ?? null);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const { data: folders = [] } = useFolders();

  const selectedFolder = folders.find(f => f.id === folderId);

  // If the stored folderId references a folder that no longer exists, clear it
  useEffect(() => {
    if (folderId && folders.length > 0 && !selectedFolder) {
      setFolderId(null);
    }
  }, [folderId, folders, selectedFolder]);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<CreateSetFormData>({
    resolver: zodResolver(createSetSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
    },
  });

  const handleSave = async (data: CreateSetFormData) => {
    try {
      await onSubmit({ ...data, visibility, layout: cardLayout, folderId, color: selectedColor });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
    }
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit(handleSave) }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  return (
    <View style={styles.container}>
      <FormField
        name="title"
        control={control}
        label="Title"
        placeholder="e.g. Romans Study"
        autoCapitalize="sentences"
        returnKeyType="next"
        maxLength={200}
      />

      <FormField
        name="description"
        control={control}
        label="Description (optional)"
        placeholder="What is this set about?"
        autoCapitalize="sentences"
        maxLength={1000}
      />

      {/* Folder picker */}
      <View>
        <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Folder (optional)
        </Typography>
        <Pressable style={({ pressed }) => [styles.picker, { backgroundColor: colors.surfaceMuted }, pressed && styles.btnPressed]} onPress={() => setFolderPickerOpen(true)}>
          <Typography preset="body" color={selectedFolder ? colors.textPrimary : colors.textDisabled}>
            {selectedFolder ? selectedFolder.name : 'No folder'}
          </Typography>
          <ChevronRightIcon size={ICON_SIZE} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Color */}
      <View>
        <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
          Color
        </Typography>
        <ColorPicker value={selectedColor} onChange={setSelectedColor} />
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
              style={({ pressed }) => [
                styles.optionChip,
                { backgroundColor: visibility === opt.value ? colors.accentSoft : colors.surfaceMuted },
                visibility === opt.value && { borderWidth: 1.5, borderColor: colors.accent },
                pressed && styles.btnPressed,
              ]}
              onPress={() => setVisibility(opt.value)}
            >
              <Typography
                preset="label"
                color={visibility === opt.value ? colors.accent : colors.textSecondary}
              >
                {opt.label}
              </Typography>
              <Typography
                preset="caption"
                color={visibility === opt.value ? colors.textSecondary : colors.textDisabled}
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
              style={({ pressed }) => [
                styles.layoutChip,
                { backgroundColor: cardLayout === opt.value ? colors.accentSoft : colors.surfaceMuted },
                cardLayout === opt.value && { borderWidth: 1.5, borderColor: colors.accent },
                pressed && styles.btnPressed,
              ]}
              onPress={() => setCardLayout(opt.value)}
            >
              <Typography
                preset="label"
                color={cardLayout === opt.value ? colors.accent : colors.textSecondary}
              >
                {opt.label}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Folder picker modal */}
      <AppModal
        visible={folderPickerOpen}
        title="Choose Folder"
        onClose={() => setFolderPickerOpen(false)}
      >
        <ScrollView style={styles.folderScroll} showsVerticalScrollIndicator={false}>
          <Pressable style={({ pressed }) => [styles.folderOption, pressed && styles.rowPressed]} onPress={() => { setFolderId(null); setFolderPickerOpen(false); }}>
            <Typography preset="body" color={!folderId ? colors.accent : colors.textPrimary}>
              No folder
            </Typography>
            {!folderId && <Badge label="Selected" variant="primary" />}
          </Pressable>
          <Divider marginV={spacing.xs} />
          {folders.map(folder => (
            <React.Fragment key={folder.id}>
              <Pressable
                style={({ pressed }) => [styles.folderOption, pressed && styles.rowPressed]}
                onPress={() => { setFolderId(folder.id); setFolderPickerOpen(false); }}
              >
                <View style={styles.folderRow}>
                  <FolderIcon size={ICON_SIZE} color={folderId === folder.id ? colors.accent : colors.textSecondary} />
                  <Typography preset="body" color={folderId === folder.id ? colors.accent : colors.textPrimary}>
                    {folder.name}
                  </Typography>
                </View>
                {folderId === folder.id && <Badge label="Selected" variant="primary" />}
              </Pressable>
              <Divider marginV={spacing.xs} />
            </React.Fragment>
          ))}
        </ScrollView>
      </AppModal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  fieldLabel: { marginBottom: spacing.s6 },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: layout.inputHeight,
    borderRadius: layout.cardRadius,
    paddingHorizontal: spacing.lg,
  },
  optionRow: { flexDirection: 'row', gap: spacing.sm },
  optionChip: {
    flex: 1,
    borderRadius: layout.cardRadius,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.s2,
  },
  layoutChip: {
    flex: 1,
    borderRadius: layout.cardRadius,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  folderScroll: { maxHeight: 300 }, // ponytail: off-grid modal cap
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnPressed: { opacity: 0.85 },
  rowPressed: { opacity: 0.7 },
});
