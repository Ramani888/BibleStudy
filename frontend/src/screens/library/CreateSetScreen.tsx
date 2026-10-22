import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import { SetForm, type SetFormHandle } from './components/SetForm';
import { QMButton, QMModalScreen } from '../../components/qm';
import { useCreateSet } from '../../hooks';
import type { LibraryScreenProps } from '../../navigation/types';

export function CreateSetScreen({ navigation, route }: LibraryScreenProps<'CreateSet'>) {
  const { t } = useTranslation(['library', 'common']);
  const { mutateAsync: createSet } = useCreateSet();
  const formRef = useRef<SetFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <QMModalScreen
      title={t('library:qm.newSet', 'New set')}
      onCancel={navigation.goBack}
      footer={<QMButton label={t('library:qm.createSetCta', 'Create set')} onPress={() => formRef.current?.submit()} loading={submitting} style={styles.flex} />}
    >
      <SetForm
        ref={formRef}
        defaultValues={{ folderId: route.params?.folderId }}
        onSubmittingChange={setSubmitting}
        onSubmit={async data => {
          await createSet({ ...data, folderId: data.folderId ?? undefined, color: data.color ?? undefined, description: data.description || undefined });
          Toast.show({ type: 'success', text1: t('library:sets.setCreated', 'Set created!') });
          navigation.goBack();
        }}
      />
    </QMModalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
