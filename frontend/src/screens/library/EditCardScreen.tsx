import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { CardForm, type CardFormHandle } from './components/CardForm';
import { ErrorState } from '../../components/feedback';
import { Button, Screen, ScreenHeader } from '../../components/ui';

import { useCardById, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing, layout } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function EditCardScreen({ navigation, route }: LibraryScreenProps<'EditCard'>) {
  const { colors } = useTheme();

  const { cardId, setId } = route.params;
  const { data: card, isLoading, isError, error, refetch } = useCardById(cardId);
  const { mutateAsync: updateCard } = useUpdateCard(setId);
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = <ScreenHeader title="Edit Card" handle />;

  if (isLoading) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }
  if (isError || !card) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <ErrorState message={getErrorMessage(error) || 'Card not found'} onRetry={refetch} />
      </Screen>
    );
  }

  const footer = (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <Button label="Save Changes" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      <View>
        <CardForm
          ref={formRef}
          defaultValues={{ type: card.type, question: card.question, answer: card.answer, note: card.note }}
          onSubmittingChange={setSubmitting}
          onSubmit={async ({ type, question, answer, note }) => {
            try {
              await updateCard({ id: cardId, payload: { type, question, answer, note: note || null } });
              Toast.show({ type: 'success', text1: 'Card updated!' });
              navigation.goBack();
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
            }
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: {
    padding: layout.screenPaddingH,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
  },
});
