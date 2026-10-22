import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { QMColorSwatches, QMSheet, type QMSheetAction } from '../qm';
import { AnimatedPressable, Typography } from '../ui';
import { PRESET_COLORS } from '../ui/ColorPicker';
import { FolderIcon, FolderOffIcon } from '../icons';
import { useFolders, useUpdateSet, type useFolderModal } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, radius, textPresets, qmAccent } from '../../theme';
import type { StudySet } from '../../types';

const FIELD_H = 52;
const BTN_H = 52;
const NAME_MAX = 200;

/** New / edit folder form in a sheet. State lives in `useFolderModal()`. */
export function FolderFormSheet({ modal, onClosed }: { modal: ReturnType<typeof useFolderModal>; onClosed?: () => void }) {
  const { t } = useTranslation('library');
  const { qm } = useTheme();
  const edit = modal.editFolderModalOpen;
  const open = modal.newFolderModalOpen || edit;
  const name = edit ? modal.editFolderName : modal.newFolderName;
  const setName = edit ? modal.setEditFolderName : modal.setNewFolderName;
  const color = edit ? modal.editFolderColor : modal.selectedColor;
  const setColor = edit ? modal.setEditFolderColor : modal.setSelectedColor;
  const busy = edit ? modal.updatingFolder : modal.creatingFolder;
  const save = edit ? modal.handleEditFolder : modal.handleCreateFolder;
  const ok = name.trim().length > 0;

  const close = () => {
    if (modal.newFolderModalOpen) modal.closeCreateModal();
    if (modal.editFolderModalOpen) modal.closeEditModal();
    onClosed?.();
  };

  return (
    <QMSheet visible={open} onClose={close} title={edit ? t('qm.editFolder', 'Edit folder') : t('qm.newFolder', 'New folder')}>
      <View style={styles.form}>
        <View style={styles.labelRow}>
          <Typography preset="qmFieldLabel" color={qm.ink}>{t('qm.name', 'Name')}</Typography>
          <Typography preset="qmBody" color={qm.muted}>{name.length} / {NAME_MAX}</Typography>
        </View>
        <BottomSheetTextInput
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX}
          placeholder={t('qm.folderPlaceholder', 'e.g. Gospels')}
          placeholderTextColor={qm.muted}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={save}
          editable={!busy}
          accessibilityLabel={t('folders.folderName', 'Folder name')}
          style={[styles.field, { backgroundColor: qm.bg, borderColor: qm.line, color: qm.ink }]}
        />
        <Typography preset="qmFieldLabel" color={qm.ink} style={styles.colorLabel}>{t('folders.color', 'Color')}</Typography>
        <QMColorSwatches value={color} onChange={setColor} presets={PRESET_COLORS} />
        <AnimatedPressable
          scaleTo={0.97}
          onPress={save}
          disabled={!ok || busy}
          style={[styles.btn, ok ? { backgroundColor: qm.violet, boxShadow: qm.btnShadow } : { backgroundColor: qm.field }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !ok, busy }}
        >
          {busy
            ? <ActivityIndicator size="small" color={qm.onViolet} />
            : <Typography preset="qmButtonLg" color={ok ? qm.onViolet : qm.muted}>{t('qm.save', 'Save')}</Typography>}
        </AnimatedPressable>
      </View>
    </QMSheet>
  );
}

/** "Move to folder" picker for one set: No folder + every folder, current one ticked. */
export function MoveToFolderSheet({ set, onClose }: { set: StudySet | null; onClose: () => void }) {
  const { t } = useTranslation(['library', 'common']);
  const { qm, name: themeName } = useTheme();
  const { data: folders = [] } = useFolders();
  const { mutate: updateSet } = useUpdateSet();

  const actions = useMemo<QMSheetAction[]>(() => {
    if (!set) return [];
    const cur = set.folderId ?? null;
    const move = (folderId: string | null, folderName?: string) => () => updateSet(
      { id: set.id, payload: { folderId } },
      {
        onSuccess: () => Toast.show({
          type: 'success',
          text1: folderId
            ? t('library:qm.movedTo', { name: folderName, defaultValue: 'Moved to folder' })
            : t('library:folders.removedFromFolder', 'Removed from folder'),
        }),
        onError: err => Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) }),
      },
    );
    return [
      { label: t('library:folders.noFolder', 'No folder'), icon: FolderOffIcon, iconColor: qm.muted, tick: !cur, onPress: move(null) },
      ...folders.map(f => ({
        label: f.name, icon: FolderIcon, iconColor: f.color ? qmAccent(qm, themeName === 'dark', f.color)[1] : qm.link,
        tick: cur === f.id, onPress: move(f.id, f.name),
      })),
    ];
  }, [set, folders, updateSet, qm, themeName, t]);

  return (
    <QMSheet visible={!!set} onClose={onClose} title={t('library:qm.moveToFolder', 'Move to folder')} sub={set?.title} actions={actions} />
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.s6 },
  field: {
    height: FIELD_H, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2, borderWidth: 1,
    ...textPresets.qmInput,
  },
  colorLabel: { marginTop: spacing.s18, marginBottom: spacing.sm },
  btn: { marginTop: spacing.xxl, height: BTN_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
