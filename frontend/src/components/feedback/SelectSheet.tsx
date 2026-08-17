import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppModal } from './Modal';
import { AccentIcon, Divider, Typography } from '../ui';
import { CheckCircleIcon, SearchIcon } from '../icons';
import type { IconComponent } from '../icons';
import { layout, spacing, useTheme } from '../../theme';
import { SearchBar } from '../ui';

export interface SelectOption {
  id: string;
  label: string;
  /** Optional accent color — renders a colored icon chip when `optionIcon` is also supplied. */
  color?: string | null;
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
  /** When supplied, each option renders an AccentIcon chip using option.color. */
  optionIcon?: IconComponent;
  /** ID of the currently selected option — shows a checkmark on that row. */
  selectedId?: string;
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
  optionIcon,
  selectedId,
}: SelectSheetProps) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleClose = () => {
    setSearch('');
    setSearchOpen(false);
    onClose();
  };

  const toggleSearch = () => {
    setSearch('');
    setSearchOpen(v => !v);
  };

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <AppModal visible={visible} onClose={handleClose}>
      {/* Header row with title + search toggle */}
      <View style={styles.header}>
        <Typography preset="h4" numberOfLines={1} style={styles.headerTitle}>{title}</Typography>
        {searchable && options.length > 0 && (
          <Pressable onPress={toggleSearch} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
            <SearchIcon size={20} color={searchOpen ? colors.accent : colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {searchOpen && (
        <SearchBar
          placeholder={searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          containerStyle={styles.search}
          autoFocus
        />
      )}

      {leadingOption && (
        <>
          <Pressable style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} onPress={leadingOption.onPress}>
            <Typography preset="body" color={colors.textSecondary} style={styles.label}>{leadingOption.label}</Typography>
          </Pressable>
          <Divider marginV={spacing.xs} />
        </>
      )}

      {options.length === 0 ? (
        <Typography preset="bodySm" color={colors.textSecondary}>{emptyText}</Typography>
      ) : (
        <ScrollView style={{ maxHeight }} showsVerticalScrollIndicator={false}>
          {filtered.map(o => {
            const isSelected = o.id === selectedId;
            return (
              <React.Fragment key={o.id}>
                <Pressable style={({ pressed }) => [styles.option, pressed && styles.optionPressed]} onPress={() => onSelect(o.id)}>
                  {optionIcon && (
                    <View style={styles.iconWrap}>
                      <AccentIcon icon={optionIcon} color={o.color} size={36} />
                    </View>
                  )}
                  <Typography preset="body" style={styles.label}>{o.label}</Typography>
                  {isSelected && (
                    <CheckCircleIcon size={20} color={colors.accent} filled />
                  )}
                </Pressable>
                <Divider marginV={spacing.xs} />
              </React.Fragment>
            );
          })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTitle: { flex: 1 },
  search: { marginBottom: spacing.sm },
  option: { paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { marginRight: spacing.md },
  label: { flex: 1 },
  noMatch: { paddingVertical: spacing.md },
  optionPressed: { opacity: 0.7 },
  iconPressed: { opacity: 0.6 },
});
