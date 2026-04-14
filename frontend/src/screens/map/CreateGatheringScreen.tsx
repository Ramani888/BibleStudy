import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';

import type { MapScreenProps } from '../../navigation/types';
import type { CreateGatheringPayload } from '../../types/gatherings.types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../api/client';
import { useCreateGathering } from '../../hooks/useGatherings';

type Props = MapScreenProps<'CreateGathering'>;

type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string }[] = [
  { value: 'PRIVATE', label: 'Private', desc: 'Only you' },
  { value: 'PUBLIC', label: 'Public', desc: 'Everyone' },
  { value: 'FRIENDS', label: 'Friends', desc: 'Friends only' },
];

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CreateGatheringScreen({ route, navigation }: Props) {
  const groupId = route.params?.groupId;
  const createGathering = useCreateGathering();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');

  const handleConfirmDate = (selectedDate: Date) => {
    setDate(selectedDate);
    setDatePickerVisible(false);
  };

  const handleUseCurrentLocation = () => {
    setIsFetchingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        setLocationLat(position.coords.latitude);
        setLocationLng(position.coords.longitude);
        setIsFetchingLocation(false);
        Toast.show({ type: 'success', text1: 'Location captured' });
      },
      error => {
        setIsFetchingLocation(false);
        Toast.show({ type: 'error', text1: 'Could not get location', text2: error.message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (!date) {
      Toast.show({ type: 'error', text1: 'Date is required' });
      return;
    }

    const payload: CreateGatheringPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: date.toISOString(),
      groupId,
      locationName: locationName.trim() || undefined,
      locationLat: locationLat ?? undefined,
      locationLng: locationLng ?? undefined,
      meetingLink: meetingLink.trim() || undefined,
      visibility,
    };

    createGathering.mutate(payload, {
      onSuccess: gathering => {
        Toast.show({ type: 'success', text1: 'Gathering created' });
        navigation.replace('GatheringDetail', { gatheringId: gathering.id });
      },
      onError: error => {
        Toast.show({ type: 'error', text1: getErrorMessage(error) });
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Typography preset="h3">New Gathering</Typography>

          <View style={styles.form}>
            {/* Title */}
            <Input
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder="Sunday Bible Study"
            />

            {/* Description */}
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="What is this gathering about?"
              multiline
              numberOfLines={3}
            />

            {/* Date picker */}
            <View>
              <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
                Date & Time *
              </Typography>
              <Pressable
                style={({ pressed }) => [
                  styles.datePicker,
                  pressed && styles.datePickerPressed,
                ]}
                onPress={() => setDatePickerVisible(true)}
              >
                <Typography
                  preset="body"
                  color={date ? colors.textPrimary : colors.textDisabled}
                >
                  {date ? formatDate(date) : 'Select date and time'}
                </Typography>
                <Typography preset="body" color={colors.textSecondary}>
                  {'›'}
                </Typography>
              </Pressable>
            </View>

            {/* Visibility */}
            <View>
              <Typography preset="label" color={colors.textSecondary} style={styles.fieldLabel}>
                Visibility
              </Typography>
              <View style={styles.optionRow}>
                {VISIBILITY_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.optionChip,
                      visibility === opt.value && styles.optionChipActive,
                    ]}
                    onPress={() => setVisibility(opt.value)}
                  >
                    <Typography
                      preset="label"
                      color={visibility === opt.value ? colors.primary : colors.textSecondary}
                    >
                      {opt.label}
                    </Typography>
                    <Typography
                      preset="caption"
                      color={
                        visibility === opt.value ? colors.primaryDark : colors.textDisabled
                      }
                    >
                      {opt.desc}
                    </Typography>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Location name */}
            <Input
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="123 Church St, City"
            />

            {/* Use current location button */}
            <View>
              <Button
                label={
                  isFetchingLocation
                    ? 'Getting location...'
                    : locationLat !== null
                    ? 'Location captured — tap to update'
                    : 'Use Current Location'
                }
                variant="outline"
                size="sm"
                onPress={handleUseCurrentLocation}
                disabled={isFetchingLocation}
                loading={isFetchingLocation}
              />
              {locationLat !== null && locationLng !== null && (
                <View style={styles.coordRow}>
                  <Typography preset="caption" color={colors.textSecondary}>
                    {`Lat: ${locationLat.toFixed(5)}, Lng: ${locationLng.toFixed(5)}`}
                  </Typography>
                </View>
              )}
            </View>

            {/* Meeting link */}
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
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        minimumDate={new Date()}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: layout.screenPaddingH,
    gap: spacing[4],
    paddingBottom: spacing[10],
  },
  form: {
    gap: spacing[4],
  },
  fieldLabel: {
    marginBottom: spacing[1.5],
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing[4],
  },
  datePickerPressed: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.primarySurface,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  optionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[0.5],
    backgroundColor: colors.backgroundSecondary,
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  coordRow: {
    marginTop: spacing[1.5],
    alignItems: 'center',
  },
});
