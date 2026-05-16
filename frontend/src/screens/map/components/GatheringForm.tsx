import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';

import { gatheringSchema } from '../../../utils/validators';
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

function formatPickerDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
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
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GatheringFormValues>({
    resolver: zodResolver(gatheringSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      date: defaultValues?.date ?? '',
      locationName: defaultValues?.locationName ?? '',
      locationLat: defaultValues?.locationLat ?? undefined,
      locationLng: defaultValues?.locationLng ?? undefined,
      meetingLink: defaultValues?.meetingLink ?? '',
      visibility: (defaultValues?.visibility as Visibility) ?? 'PUBLIC',
    },
  });

  const dateValue = watch('date');
  const locationLat = watch('locationLat');
  const locationLng = watch('locationLng');
  const visibility = watch('visibility');

  const handleConfirmDate = (selectedDate: Date) => {
    setValue('date', selectedDate.toISOString(), { shouldValidate: true });
    setDatePickerVisible(false);
  };

  const handleUseCurrentLocation = () => {
    setIsFetchingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        setValue('locationLat', position.coords.latitude);
        setValue('locationLng', position.coords.longitude);
        setIsFetchingLocation(false);
        Toast.show({ type: 'success', text1: 'Location captured' });
      },
      err => {
        setIsFetchingLocation(false);
        Toast.show({ type: 'error', text1: 'Could not get location', text2: err.message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
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
          <Controller
            name="title"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Title *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Sunday Bible Study"
                error={errors.title?.message}
              />
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Description"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="What is this gathering about?"
                multiline
                numberOfLines={3}
              />
            )}
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
                !!errors.date && styles.datePickerError,
              ]}
              onPress={() => setDatePickerVisible(true)}
            >
              <Typography
                preset="body"
                color={dateValue ? colors.textPrimary : colors.textDisabled}
              >
                {dateValue ? formatPickerDate(dateValue) : 'Select date and time'}
              </Typography>
              <Icon name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
            </Pressable>
            {errors.date && (
              <Typography preset="caption" color={colors.error} style={styles.errorText}>
                {errors.date.message}
              </Typography>
            )}
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
                  onPress={() => setValue('visibility', opt.value)}
                >
                  <Typography
                    preset="label"
                    color={visibility === opt.value ? colors.primary : colors.textSecondary}
                  >
                    {opt.label}
                  </Typography>
                  <Typography
                    preset="caption"
                    color={visibility === opt.value ? colors.primaryDark : colors.textDisabled}
                  >
                    {opt.desc}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Location name */}
          <Controller
            name="locationName"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Location Name"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="123 Church St, City"
              />
            )}
          />

          {/* Use current location button */}
          <View>
            <Button
              label={
                isFetchingLocation
                  ? 'Getting location...'
                  : locationLat !== undefined
                  ? 'Location captured — tap to update'
                  : 'Use Current Location'
              }
              variant="outline"
              size="sm"
              onPress={handleUseCurrentLocation}
              disabled={isFetchingLocation}
              loading={isFetchingLocation}
            />
            {locationLat !== undefined && locationLng !== undefined && (
              <View style={styles.coordRow}>
                <Typography preset="caption" color={colors.textSecondary}>
                  {`Lat: ${locationLat.toFixed(5)}, Lng: ${locationLng.toFixed(5)}`}
                </Typography>
              </View>
            )}
          </View>

          {/* Meeting link */}
          <Controller
            name="meetingLink"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Meeting Link"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="https://zoom.us/j/..."
                autoCapitalize="none"
                keyboardType="url"
              />
            )}
          />
        </View>

        <Button
          label={submitLabel}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
        />
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        minimumDate={new Date()}
        date={dateValue ? new Date(dateValue) : new Date()}
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
  errorText: { marginTop: spacing[1] },
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
  datePickerError: {
    borderColor: colors.error,
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
