import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Input } from './Input';
import { SearchIcon, CloseCircleIcon } from '../icons';
import { useTheme } from '../../theme';

const ICON_SIZE = 18;

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  containerStyle?: ViewStyle;
}

/** Standard search field: search icon · input · clear (✕) when non-empty. */
export function SearchBar({ value, onChangeText, placeholder, autoFocus, containerStyle }: SearchBarProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  return (
    <Input
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? t('actions.searchPlaceholder')}
      autoFocus={autoFocus}
      returnKeyType="search"
      containerStyle={containerStyle}
      leftIcon={<SearchIcon size={ICON_SIZE} color={colors.textDisabled} />}
      rightIcon={
        value.length > 0 ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} style={({ pressed }) => pressed && { opacity: 0.85 }} accessibilityRole="button" accessibilityLabel={t('actions.clearSearch')}>
            <CloseCircleIcon size={ICON_SIZE} color={colors.textDisabled} />
          </Pressable>
        ) : undefined
      }
    />
  );
}
