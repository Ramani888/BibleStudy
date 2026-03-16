import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetForm } from './components/SetForm';
import { colors, layout } from '../../theme';
import { useSet, useUpdateSet } from '../../hooks';
import type { LibraryScreenProps } from '../../navigation/types';

export function EditSetScreen({ navigation, route }: LibraryScreenProps<'EditSet'>) {
  const { setId } = route.params;
  const { data: set, isLoading } = useSet(setId);
  const { mutateAsync: updateSet } = useUpdateSet(setId);

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingH },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
