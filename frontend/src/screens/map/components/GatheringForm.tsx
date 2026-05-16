import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { colors, layout, spacing } from '../../../theme';
import { Typography } from '../../../components/ui/Typography';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import type { Gathering } from '../../../types/gatherings.types';

const CHEVRON_SIZE = 18;

type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';

export interface GatheringFormValues {
  title: string;
  description?: string;
  date: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  meetingLink?: string;
  visibility: Visibility;
}

interface GatheringFormProps {
  defaultValues?: Partial<Gathering>;
  onSubmit: (values: GatheringFormValues) => Promise<void>;
  submitLabel?: string;
}

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

export function GatheringForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Create Gathering',
}: GatheringFormProps) {
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [date, setDate] = useState<Date | null>(
    defaultValues?.date ? new Date(defaultValues.date) : null,
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [locationName, setLocationName] = useState(defaultValues?.locationName ?? '');
  const [locationLat, setLocationLat] = useState<number | null>(
    defaultValues?.locationLat ?? null,
  );
  const [locationLng, setLocationLng] = useState<number | null>(
    defaultValues?.locationLng ?? null,
  );
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [meetingLink, setMeetingLink] = useState(defaultValues?.meetingLink ?? '');
  const [visibility, setVisibility] = useState<Visibility>(
    defaultValues?.visibility ?? 'PUBLIC',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (!date) {
      Toast.show({ type: 'error', text1: 'Date is required' });
      return;
    }

    const values: GatheringFormValues = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: date.toISOString(),
      locationName: locationName.trim() || undefined,
      locationLat: locationLat ?? undefined,
      locationLng: locationLng ?? undefined,
      meetingLink: meetingLink.trim() || undefined,
      visibility,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
              <Icon name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
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
          label={submitLabel}
          onPress={handleSubmit}
          loading={isSubmitting}
          fullWidth
        />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        minimumDate={new Date()}
        date={date ?? new Date()}
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: layout.screenPaddingH,
    gap: spacing[4],
    paddingBottom: spacing[10],
  },
  form: { gap: spacing[4] },
  fieldLabel: { marginBottom: spacing[1.5] },
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
  optionRow: { flexDirection: 'row', gap: spacing[2] },
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
  coordRow: { marginTop: spacing[1.5], alignItems: 'center' },
});
