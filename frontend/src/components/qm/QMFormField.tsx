import React from 'react';
import { TextInput } from 'react-native';
import { Controller, ControllerProps, FieldValues, Path } from 'react-hook-form';
import { QMInput, type QMInputProps } from './QMInput';

type QMFormFieldProps<T extends FieldValues> = Omit<QMInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> & {
  name: Path<T>;
  control: ControllerProps<T>['control'];
  inputRef?: React.Ref<TextInput>;
  /** Hide the zod message (when the screen shows its own, e.g. password rules). */
  hideError?: boolean;
};

/** react-hook-form binding for QMInput. */
export function QMFormField<T extends FieldValues>({ name, control, inputRef, hideError, ...inputProps }: QMFormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <QMInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={hideError ? undefined : error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
