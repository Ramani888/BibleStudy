import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppModal } from './Modal';
import { Divider, SearchBar, Typography } from '../ui';
import { spacing, useTheme } from '../../theme';

export interface SelectOption {
  id: string;
  label: string;
}

interface SelectSheetProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  onSelect: (id: string) => void;
  onClose: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Optional fixed row shown before the list (e.g. "No Folder"). */
  leadingOption?: { label: string; onPress: () => void };
  maxHeight?: number;
}

/** One searchable list-picker for "move to / assign to / choose one" flows. */
export function SelectSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
  searchable = true,
  searchPlaceholder = 'Search…',
  emptyText = 'No options available',
  leadingOption,
  maxHeight = 300,
}: SelectSheetProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <AppModal visible={visible} title={title} onClose={handleClose}>
      {searchable && options.length > 0 && (
        <SearchBar
          placeholder={searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.search}
        />
      )}

      {leadingOption && (
        <>
          <Pressable style={styles.option} onPress={leadingOption.onPress}>
            <Typography preset="body" color={colors.textSecondary}>{leadingOption.label}</Typography>
          </Pressable>
          <Divider marginV={spacing.xs} />
        </>
      )}

      {options.length === 0 ? (
        <Typography preset="bodySm" color={colors.textSecondary}>{emptyText}</Typography>
      ) : (
        <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator={false}>
          {filtered.map(o => (
            <React.Fragment key={o.id}>
              <Pressable style={styles.option} onPress={() => onSelect(o.id)}>
                <Typography preset="body">{o.label}</Typography>
              </Pressable>
              <Divider marginV={spacing.xs} />
            </React.Fragment>
          ))}
          {filtered.length === 0 && (
            <Typography preset="bodySm" color={colors.textSecondary} style={styles.noMatch}>
              No matches for "{search}"
            </Typography>
          )}
        </ScrollView>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: spacing.sm },
  option: { paddingVertical: spacing.md },
  noMatch: { paddingVertical: spacing.md },
});
