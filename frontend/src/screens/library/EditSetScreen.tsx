import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { useTranslation } from 'react-i18next';
import { ConfirmDialog, ErrorState } from '../../components/feedback';
import { SetForm, type SetFormHandle } from './components/SetForm';
import { Button, Screen, ScreenHeader, Typography } from '../../components/ui';
import { TrashIcon } from '../../components/icons';

import { useConfirmDialog, useSet, useUpdateSet, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, layout } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const ICON_SIZE = 20;

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const { t } = useTranslation(['library', 'common']);
  const { colors } = useTheme();
  const { setId } = route.params;
  const { data: set, isLoading, isError, refetch } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();

  const formRef = useRef<SetFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title={t('library:sets.editSet')} handle />;

  const handleDelete = () => {
    show({
      title: t('common:dialogs.deleteConfirmTitle'),
      message: t('library:dialogs.deleteSetMessage', 'All cards in this set will also be deleted. This cannot be undone.'),
      confirmLabel: t('common:actions.delete'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(setId);
          Toast.show({ type: 'success', text1: t('library:sets.setDeleted', 'Set deleted') });
          navigation.popToTop();
        } catch (err) {
          Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Screen header={header}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !set) {
    return (
      <Screen header={header}>
        <ErrorState message={t('library:sets.couldNotLoadSet', 'Could not load set.')} onRetry={refetch} />
      </Screen>
    );
  }

  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label={t('common:actions.saveChanges', 'Save Changes')} onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <SetForm
            ref={formRef}
            defaultValues={set}
            onSubmittingChange={setSubmitting}
            onSubmit={async data => {
              await updateSet({ id: setId, payload: { ...data, description: data.description || null } });
              Toast.show({ type: 'success', text1: t('library:sets.setUpdated', 'Set updated!') });
              navigation.goBack();
            }}
          />
        </View>
        <View>
          <View style={[styles.deleteSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={handleDelete} hitSlop={8} style={({ pressed }) => [styles.deleteRow, pressed && styles.rowPressed]}>
              <TrashIcon size={ICON_SIZE} color={colors.alert} />
              <Typography preset="label" color={colors.alert}>{t('library:sets.deleteSet', 'Delete Set')}</Typography>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.huge },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
  deleteSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowPressed: { opacity: 0.7 },
});
