import React, { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { Controller, ControllerProps, FieldValues, Path } from 'react-hook-form';
import { Input } from '../ui/Input';

type FormFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: ControllerProps<T>['control'];
  label?: string;
  hint?: string;
  placeholder?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  inputRef?: React.Ref<TextInput>;
};

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  hint,
  placeholder,
  isPassword,
  leftIcon,
  autoCapitalize = 'none',
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          ref={inputRef}
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          hint={hint}
          isPassword={isPassword}
          leftIcon={leftIcon}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      )}
    />
  );
}

// Re-export for convenience when you need a standalone ref-able Input
export const RefInput = forwardRef<TextInput, React.ComponentProps<typeof Input>>(
  (props, ref) => <Input ref={ref} {...props} />,
);
