import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { ConfirmDialog, ErrorState } from '../../components/feedback';
import { SetForm, type SetFormHandle } from './components/SetForm';
import { Button, Screen, ScreenHeader, Typography } from '../../components/ui';
import { TrashIcon } from '../../components/icons';

import { useConfirmDialog, useSet, useUpdateSet, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const ICON_SIZE = 20;

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
  const { setId } = route.params;
  const { data: set, isLoading, isError, refetch } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();

  const formRef = useRef<SetFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title="Edit Set" handle />;

  const handleDelete = () => {
    show({
      title: 'Delete Set',
      message: 'All cards in this set will also be deleted. This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteSetAsync(setId);
          Toast.show({ type: 'success', text1: 'Set deleted' });
          navigation.popToTop();
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  if (isLoading) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !set) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <ErrorState message="Could not load set." onRetry={refetch} />
      </Screen>
    );
  }

  const footer = (
    <View style={styles.footer}>
      <Button label="Save Changes" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
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
              Toast.show({ type: 'success', text1: 'Set updated!' });
              navigation.goBack();
            }}
          />
        </View>
        <View>
          <View style={styles.deleteSection}>
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteRow}>
              <TrashIcon size={ICON_SIZE} color={colors.error} />
              <Typography preset="label" color={colors.error}>Delete Set</Typography>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deleteSection: {
      marginTop: spacing[6],
      alignItems: 'center',
      paddingVertical: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  });
