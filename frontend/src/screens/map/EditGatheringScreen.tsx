import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Geolocation from '@react-native-community/geolocation';

import type { MapScreenProps } from '../../navigation/types';
import { colors, layout, spacing } from '../../theme';
import { Typography } from '../../components/ui/Typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingOverlay } from '../../components/feedback/LoadingOverlay';
import { ErrorState } from '../../components/feedback/ErrorState';
import { getErrorMessage } from '../../api/client';
import { useGathering, useUpdateGathering } from '../../hooks/useGatherings';

type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'PRIVATE', label: 'Private' },
];

type Props = MapScreenProps<'EditGathering'>;

export function EditGatheringScreen({ route, navigation }: Props) {
  const { gatheringId } = route.params;
  const { data: gathering, isLoading, error, refetch } = useGathering(gatheringId);
  const updateGathering = useUpdateGathering();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [locationName, setLocationName] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (gathering) {
      setTitle(gathering.title);
      setDescription(gathering.description ?? '');
      setDate(new Date(gathering.date));
      setLocationName(gathering.locationName ?? '');
      setMeetingLink(gathering.meetingLink ?? '');
      setLat(gathering.locationLat ?? null);
      setLng(gathering.locationLng ?? null);
      setVisibility(gathering.visibility ?? 'PUBLIC');
    }
  }, [gathering]);

  const handleConfirmDate = (selectedDate: Date) => {
    setDatePickerVisible(false);
    setDate(selectedDate);
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    Geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLocating(false);
        Toast.show({ type: 'success', text1: 'Location captured' });
      },
      (err) => {
        setIsLocating(false);
        Toast.show({ type: 'error', text1: err.message ?? 'Could not get location' });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }

    updateGathering.mutate(
      {
        id: gatheringId,
        payload: {
          title: title.trim(),
          description: description.trim() || undefined,
          date: date.toISOString(),
          locationName: locationName.trim() || undefined,
          meetingLink: meetingLink.trim() || undefined,
          locationLat: lat ?? undefined,
          locationLng: lng ?? undefined,
          visibility,
        },
      },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Gathering updated' });
          navigation.goBack();
        },
        onError: (err) => {
          Toast.show({ type: 'error', text1: getErrorMessage(err) });
        },
      },
    );
  };

  if (isLoading) {
    return <LoadingOverlay visible />;
  }

  if (error || !gathering) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const dateLabel = date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const locationCaptured = lat !== null && lng !== null;

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
          <Typography preset="h3">Edit Gathering</Typography>

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

            {/* Date & Time */}
            <View style={styles.fieldGroup}>
              <Typography preset="label" color={colors.textSecondary}>
                Date & Time *
              </Typography>
              <Pressable
                style={styles.dateButton}
                onPress={() => setDatePickerVisible(true)}
              >
                <Typography preset="body" color={colors.textPrimary}>
                  {dateLabel}
                </Typography>
              </Pressable>
            </View>

            {/* Location name */}
            <Input
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="123 Church St, City"
            />

            {/* Lat / lng capture */}
            <View style={styles.fieldGroup}>
              <Typography preset="label" color={colors.textSecondary}>
                Map Pin
              </Typography>
              {locationCaptured && (
                <Typography preset="caption" color={colors.textSecondary} style={styles.coords}>
                  {`${lat!.toFixed(5)}, ${lng!.toFixed(5)}`}
                </Typography>
              )}
              <Button
                label={
                  isLocating
                    ? 'Locating…'
                    : locationCaptured
                    ? 'Update Location'
                    : 'Use Current Location'
                }
                variant="outline"
                size="sm"
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                style={styles.locationBtn}
              />
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

            {/* Visibility */}
            <View style={styles.fieldGroup}>
              <Typography preset="label" color={colors.textSecondary}>
                Visibility
              </Typography>
              <View style={styles.chips}>
                {VISIBILITY_OPTIONS.map((opt) => {
                  const active = visibility === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setVisibility(opt.value)}
                    >
                      <Typography
                        preset="caption"
                        color={active ? colors.textOnPrimary : colors.textSecondary}
                      >
                        {opt.label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Button
            label="Save Changes"
            onPress={handleSave}
            loading={updateGathering.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={date}
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
  },
  form: {
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[2],
  },
  dateButton: {
    height: layout.inputHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  coords: {
    marginTop: -spacing[1],
  },
  locationBtn: {
    alignSelf: 'flex-start',
  },
  chips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
