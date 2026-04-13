import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { MapScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SetCardSkeleton } from '../../components/feedback';
import { getErrorMessage } from '../../api/client';
import { useGathering, useUpdateGathering } from '../../hooks/useGatherings';

type Props = MapScreenProps<'EditGathering'>;

export function EditGatheringScreen({ route, navigation }: Props) {
  const { gatheringId } = route.params;
  const { data: gathering, isLoading } = useGathering(gatheringId);
  const updateGathering = useUpdateGathering();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (gathering) {
      setTitle(gathering.title);
      setDescription(gathering.description ?? '');
      setLocationName(gathering.locationName ?? '');
      setMeetingLink(gathering.meetingLink ?? '');
    }
  }, [gathering]);

  const handleSave = () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    updateGathering.mutate(
      { id: gatheringId, payload: { title: title.trim(), description: description.trim() || undefined, locationName: locationName.trim() || undefined, meetingLink: meetingLink.trim() || undefined } },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Gathering updated' });
          navigation.goBack();
        },
        onError: (error) => {
          Toast.show({ type: 'error', text1: getErrorMessage(error) });
        },
      }
    );
  };

  if (isLoading) return <SetCardSkeleton />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Input label="Title *" value={title} onChangeText={setTitle} />
            <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            <Input label="Location" value={locationName} onChangeText={setLocationName} />
            <Input label="Meeting Link" value={meetingLink} onChangeText={setMeetingLink} autoCapitalize="none" keyboardType="url" />
          </View>
          <Button label="Save Changes" onPress={handleSave} loading={updateGathering.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: layout.screenPaddingH, gap: spacing[4] },
  form: { gap: spacing[3] },
});
