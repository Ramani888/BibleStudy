import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { CardForm, type CardFormHandle } from './components/CardForm';
import { QMButton, QMEmpty, QMModalScreen } from '../../components/qm';
import { RefreshIcon } from '../../components/icons';
import { useCardById, useSets, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

export function EditCardScreen({ navigation, route }: LibraryScreenProps<'EditCard'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const { cardId, setId } = route.params;
  const { data: card, isLoading, isError, error, refetch } = useCardById(cardId);
  const { data: sets = [] } = useSets();
  const { mutateAsync: updateCard } = useUpdateCard(setId);
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);
  const ready = !isLoading && !isError && !!card;

  return (
    <QMModalScreen
      title={t('library:qm.editCard', 'Edit card')}
      sub={sets.find(s => s.id === setId)?.title}
      onCancel={navigation.goBack}
      footer={ready ? <QMButton label={t('library:qm.save', 'Save')} onPress={() => formRef.current?.submit()} loading={submitting} style={styles.flex} /> : undefined}
    >
      {isLoading ? (
        <ActivityIndicator color={qm.violet} style={styles.loading} />
      ) : !card || isError ? (
        <QMEmpty
          style={styles.loading}
          icon={RefreshIcon}
          title={t('library:cards.cardNotFound', 'Card not found')}
          text={getErrorMessage(error) || undefined}
          action={{ label: t('library:qm.tryAgain', 'Try again'), onPress: () => refetch() }}
        />
      ) : (
        <CardForm
          ref={formRef}
          lockedType
          defaultValues={{ type: card.type, question: card.question, answer: card.answer, note: card.note }}
          onSubmittingChange={setSubmitting}
          onSubmit={async ({ type, question, answer, note }) => {
            try {
              await updateCard({ id: cardId, payload: { type, question, answer, note: note || null } });
              Toast.show({ type: 'success', text1: t('library:cards.cardUpdated', 'Card updated!') });
              navigation.goBack();
            } catch (err) {
              Toast.show({ type: 'error', text1: t('common:status.error', 'Oops!'), text2: getErrorMessage(err) });
            }
          }}
        />
      )}
    </QMModalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: spacing.huge },
});
