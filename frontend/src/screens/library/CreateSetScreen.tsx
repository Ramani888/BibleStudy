import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { SetForm, type SetFormHandle } from './components/SetForm';
import { Button, Screen, ScreenHeader } from '../../components/ui';
import { useCreateSet } from '../../hooks';
import { layout, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function CreateSetScreen({ navigation, route }: LibraryScreenProps<'CreateSet'>) {
  const { colors } = useTheme();
  const { mutateAsync: createSet } = useCreateSet();

  const formRef = useRef<SetFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title="New Set" handle />;
  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label="Create Set" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top']} keyboardAvoiding>
      <ScrollView style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <SetForm
            ref={formRef}
            defaultValues={{ folderId: route.params?.folderId }}
            onSubmittingChange={setSubmitting}
            onSubmit={async data => {
              await createSet({ ...data, folderId: data.folderId ?? undefined, color: data.color ?? undefined, description: data.description || undefined });
              Toast.show({ type: 'success', text1: 'Set created!' });
              navigation.goBack();
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, gap: spacing.lg },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
