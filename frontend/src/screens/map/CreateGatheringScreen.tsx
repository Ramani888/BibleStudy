import React, { useState } from 'react';
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
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../api/client';
import { useCreateGathering } from '../../hooks/useGatherings';

type Props = MapScreenProps<'CreateGathering'>;

export function CreateGatheringScreen({ route, navigation }: Props) {
  const groupId = route.params?.groupId;
  const createGathering = useCreateGathering();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const handleCreate = () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (!date.trim()) {
      Toast.show({ type: 'error', text1: 'Date is required (ISO format: 2026-05-01T10:00:00Z)' });
      return;
    }

    createGathering.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        groupId,
        locationName: locationName.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      },
      {
        onSuccess: (gathering) => {
          Toast.show({ type: 'success', text1: 'Gathering created' });
          navigation.replace('GatheringDetail', { gatheringId: gathering.id });
        },
        onError: (error) => {
          Toast.show({ type: 'error', text1: getErrorMessage(error) });
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Typography preset="h3">New Gathering</Typography>

          <View style={styles.form}>
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="Sunday Bible Study"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="What is this gathering about?"
              multiline
              numberOfLines={3}
            />
            <Input
              label="Date & Time (ISO 8601) *"
              value={date}
              onChangeText={setDate}
              placeholder="2026-05-01T10:00:00Z"
              autoCapitalize="none"
            />
            <Input
              label="Location"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="123 Church St, City"
            />
            <Input
              label="Meeting Link"
              value={meetingLink}
              onChangeText={setMeetingLink}
              placeholder="https://zoom.us/j/..."
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <Button
            label="Create Gathering"
            onPress={handleCreate}
            loading={createGathering.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: layout.screenPaddingH,
    gap: spacing[4],
  },
  form: {
    gap: spacing[3],
  },
});
