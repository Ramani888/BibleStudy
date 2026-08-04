import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { ConfirmDialog, ErrorState } from '../../components/feedback';
import { SetForm } from './components/SetForm';
import { Typography } from '../../components/ui';

import { colors, layout, spacing } from '../../theme';
import { useConfirmDialog, useSet, useUpdateSet, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import type { LibraryScreenProps } from '../../navigation/types';

const ICON_SIZE = 20;

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const { setId } = route.params;
  const { data: set, isLoading, isError, refetch } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet();
  const { mutateAsync: deleteSetAsync } = useDeleteSet();
  const { show, dialogProps } = useConfirmDialog();

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
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !set) {
    return <ErrorState message="Could not load set." onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SetForm
          defaultValues={set}
          submitLabel="Save Changes"
          onSubmit={async data => {
            await updateSet({ id: setId, payload: { ...data, description: data.description || null } });
            Toast.show({ type: 'success', text1: 'Set updated!' });
            navigation.goBack();
          }}
        />
        <View style={styles.deleteSection}>
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteRow}>
            <Icon name="trash-outline" size={ICON_SIZE} color={colors.error} />
            <Typography preset="label" color={colors.error}>Delete Set</Typography>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[10] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  deleteSection: {
    marginTop: spacing[6],
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
