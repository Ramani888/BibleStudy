import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CardForm, type CardFormHandle } from './components/CardForm';
import { Button, Screen, ScreenHeader } from '../../components/ui';

import { useCreateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { setId } = route.params;
  const { mutateAsync: createCard } = useCreateCard();
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title="Add Cards" handle />;
  const footer = (
    <View style={styles.footer}>
      <Button label="Add Card" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      <View>
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

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
