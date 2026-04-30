import React from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetForm } from './components/SetForm';
import { Typography } from '../../components/ui';
import { colors, layout, spacing } from '../../theme';
import { useSet, useUpdateSet, useDeleteSet } from '../../hooks';
import { getErrorMessage } from '../../api';
import type { LibraryScreenProps } from '../../navigation/types';

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const { setId } = route.params;
  const { data: set, isLoading } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet(setId);
  const { mutate: deleteSet } = useDeleteSet();

  const handleDelete = () => {
    Alert.alert(
      'Delete Set',
      'All cards in this set will also be deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteSet(setId, {
              onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Set deleted' });
                navigation.navigate('Library');
              },
              onError: err =>
                Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) }),
            }),
        },
      ],
    );
  };

  if (isLoading || !set) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SetForm
          defaultValues={set}
          submitLabel="Save Changes"
          onSubmit={async data => {
            await updateSet(data);
            Toast.show({ type: 'success', text1: 'Set updated!' });
            navigation.goBack();
          }}
        />
        <View style={styles.deleteSection}>
          <Pressable onPress={handleDelete} hitSlop={8}>
            <Typography preset="label" color={colors.error} align="center">
              🗑 Delete Set
            </Typography>
          </Pressable>
        </View>
      </ScrollView>
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
});
