import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { SetForm, type SetFormHandle } from './components/SetForm';
import { QMButton, QMConfirmDialog, QMEmpty, QMModalScreen } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { RefreshIcon, TrashIcon } from '../../components/icons';
import { useConfirmDialog, useSet, useUpdateSet, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, radius } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const BTN_H = 52;

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const { setId } = route.params;
  const { data: set, isLoading, isError, refetch } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();
  const formRef = useRef<SetFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = () => {
    const count = set?._count?.cards ?? 0;
    show({
      title: t('library:qm.deleteSetTitle', 'Delete this set?'),
      message: t('library:qm.deleteSetMessage', { title: set?.title ?? '', count }),
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

  const ready = !isLoading && !isError && !!set;

  return (
    <QMModalScreen
      title={t('library:qm.editSet', 'Edit set')}
      onCancel={navigation.goBack}
      footer={ready ? <QMButton label={t('library:qm.saveChanges', 'Save changes')} onPress={() => formRef.current?.submit()} loading={submitting} style={styles.flex} /> : undefined}
    >
      {isLoading ? (
        <ActivityIndicator color={qm.violet} style={styles.loading} />
      ) : !set || isError ? (
        <QMEmpty
          style={styles.loading}
          icon={RefreshIcon}
          title={t('library:qm.setFailedTitle', 'This set did not load')}
          text={t('library:qm.loadFailedText', 'Check your connection, then try again.')}
          action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: () => refetch() }}
        />
      ) : (
        <>
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
          <AnimatedPressable
            scaleTo={0.97}
            onPress={handleDelete}
            style={[styles.delete, { borderColor: qm.line }]}
            accessibilityRole="button"
          >
            <TrashIcon size={18} color={qm.error} strokeWidth={2} />
            <Typography preset="qmButtonLg" color={qm.error}>{t('library:qm.deleteSetCta', 'Delete this set')}</Typography>
          </AnimatedPressable>
        </>
      )}
      <QMConfirmDialog {...dialogProps} />
    </QMModalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: spacing.huge },
  delete: {
    marginTop: spacing.s28, height: BTN_H, borderRadius: radius.r12 + 2, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
});
