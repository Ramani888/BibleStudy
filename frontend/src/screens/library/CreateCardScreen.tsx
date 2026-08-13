import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CardForm, type CardFormHandle } from './components/CardForm';
import { Button, Screen, ScreenHeader } from '../../components/ui';

import { useCreateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { layout, spacing, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const { colors } = useTheme();

  const { setId } = route.params;
  const { mutateAsync: createCard } = useCreateCard();
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title="Add Cards" handle onClose={() => navigation.goBack()} />;
  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label="Add Card" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} keyboardAvoiding>
      <View style={styles.flex}>
        <CardForm
          ref={formRef}
          onSubmittingChange={setSubmitting}
          onSubmit={async ({ type, question, answer, note }) => {
            try {
              await createCard({ setId, type, question, answer, note: note || undefined });
              Toast.show({ type: 'success', text1: 'Card added!' });
              navigation.goBack();
            } catch (e) {
              Toast.show({ type: 'error', text1: getErrorMessage(e) });
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
