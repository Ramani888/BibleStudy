import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { CardForm, type CardFormHandle } from './components/CardForm';
import { QMButton, QMModalScreen } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { useCreateCard, useSets } from '../../hooks';
import { getErrorMessage } from '../../api';
import { useTheme, radius } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const NEXT_H = 54;

export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const { setId } = route.params;
  const { data: sets = [] } = useSets();
  const { mutateAsync: createCard } = useCreateCard();
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <QMModalScreen
      title={t('library:qm.newCard', 'New card')}
      sub={sets.find(s => s.id === setId)?.title}
      onCancel={navigation.goBack}
      footer={(
        <>
          <AnimatedPressable
            scaleTo={0.97}
            disabled={submitting}
            onPress={() => formRef.current?.submit(true)}
            style={[styles.next, { backgroundColor: qm.lilac }]}
            accessibilityRole="button"
          >
            <Typography preset="qmButtonLg" color={qm.lilacInk}>{t('library:qm.addAndNext', 'Add & next')}</Typography>
          </AnimatedPressable>
          <QMButton label={t('library:qm.addCardCta', 'Add card')} onPress={() => formRef.current?.submit()} loading={submitting} style={styles.flex} />
        </>
      )}
    >
      <CardForm
        ref={formRef}
        onSubmittingChange={setSubmitting}
        onSubmit={async ({ type, question, answer, note }, next) => {
          try {
            await createCard({ setId, type, question, answer, note: note || undefined });
            Toast.show({ type: 'success', text1: t('library:cards.cardAdded', 'Card added!') });
            if (!next) navigation.goBack();
          } catch (e) {
            Toast.show({ type: 'error', text1: getErrorMessage(e) });
            throw e; // keep the form filled on failure
          }
        }}
      />
    </QMModalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  next: { flex: 1, height: NEXT_H, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
