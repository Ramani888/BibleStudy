import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SetForm } from './components/SetForm';
import { colors, layout, spacing } from '../../theme';
import { useCreateSet } from '../../hooks';
import type { LibraryScreenProps } from '../../navigation/types';

export function CreateSetScreen({ navigation, route }: LibraryScreenProps<'CreateSet'>) {
  const { mutateAsync: createSet } = useCreateSet();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SetForm
          defaultValues={{ folderId: route.params?.folderId }}
          submitLabel="Create Set"
          onSubmit={async data => {
            await createSet({ ...data, color: data.color ?? undefined });
            Toast.show({ type: 'success', text1: 'Set created!' });
            navigation.goBack();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: layout.screenPaddingH, gap: spacing[4] },
});
