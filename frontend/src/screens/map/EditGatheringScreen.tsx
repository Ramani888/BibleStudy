import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { MapScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { getErrorMessage } from '../../api/client';
import { useGathering, useUpdateGathering } from '../../hooks/useGatherings';
import { GatheringForm } from './components/GatheringForm';
import type { GatheringFormValues } from './components/GatheringForm';

type Props = MapScreenProps<'EditGathering'>;

export function EditGatheringScreen({ route, navigation }: Props) {
  const { gatheringId } = route.params;
  const { data: gathering, isLoading, error, refetch } = useGathering(gatheringId);
  const { mutateAsync: updateGathering } = useUpdateGathering();

  const handleSave = async (values: GatheringFormValues) => {
    try {
      await updateGathering({ id: gatheringId, payload: values });
      Toast.show({ type: 'success', text1: 'Gathering updated' });
      navigation.goBack();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  if (isLoading) return <LoadingOverlay visible />;

  if (error || !gathering) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <GatheringForm
        defaultValues={gathering}
        onSubmit={handleSave}
        submitLabel="Save Changes"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});
