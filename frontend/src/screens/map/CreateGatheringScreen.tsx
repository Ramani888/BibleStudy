import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { MapScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { getErrorMessage } from '../../api/client';
import { useCreateGathering } from '../../hooks/useGatherings';
import { GatheringForm } from './components/GatheringForm';
import type { GatheringFormValues } from './components/GatheringForm';

type Props = MapScreenProps<'CreateGathering'>;

export function CreateGatheringScreen({ route, navigation }: Props) {
  const groupId = route.params?.groupId;
  const { mutateAsync: createGathering } = useCreateGathering();

  const handleCreate = async (values: GatheringFormValues) => {
    try {
      const gathering = await createGathering({ ...values, groupId });
      Toast.show({ type: 'success', text1: 'Gathering created!' });
      navigation.replace('GatheringDetail', { gatheringId: gathering.id });
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <GatheringForm onSubmit={handleCreate} submitLabel="Create Gathering" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});
