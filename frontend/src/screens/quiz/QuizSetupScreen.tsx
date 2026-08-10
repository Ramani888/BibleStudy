import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { AppModal, EmptyState } from '../../components/feedback';
import { Button, FilterChip, Input, Screen, SearchBar, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ChevronRightIcon, SearchIcon, ShuffleIcon, SortIcon } from '../../components/icons';
import { useSearchToggle, useSets } from '../../hooks';
import { supportedModes } from '../../hooks/useQuizSession';
import { useCardsForSets } from '../../hooks';
import { type Theme, useTheme } from '../../theme';
import type { QuizSelectableMode } from '../../types';
import type { QuizStackParamList } from '../../navigation/types';

type Params = QuizStackParamList['QuizSetup'];
type SortOrder = 'newest' | 'alpha' | 'cards';

const ALL_SELECTABLE: QuizSelectableMode[] = ['mix', 'mc', 'story_mc', 'type_answer', 'type_verbatim', 'blanks', 'chunks', 'read'];
const MODE_LABEL: Record<QuizSelectableMode, string> = {
  mix: 'Mix', mc: 'Multiple Choice', story_mc: 'Story MC',
  type_answer: 'Type Answer', type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks', chunks: 'Reorder', read: 'Read',
};
const modeDesc: Record<QuizSelectableMode, string> = {
  mix: 'Random mix of all available types',
  mc: 'Pick the correct answer from 4 options',
  story_mc: 'Match reference to the correct passage',
  type_answer: 'Type the answer from memory',
  type_verbatim: 'Type the full passage verbatim',
  blanks: 'Fill in the missing words',
  chunks: 'Put the passage chunks in order',
  read: 'Read & memorize — not scored',
};
const SORT_LABEL: Record<SortOrder, string> = { newest: 'Recent', alpha: 'A–Z', cards: 'Cards' };

export function QuizSetupScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors, spacing } = theme;
  const navigation = useNavigation<any>();
  const { params } = useRoute<RouteProp<{ QuizSetup: Params }, 'QuizSetup'>>();

  const preIds = params?.preSelectedSetIds ?? [];
  const preTitles = params?.preSelectedSetTitles ?? [];

  const [quizName, setQuizName] = useState('');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>(preIds);
  const [selectedSetTitles, setSelectedSetTitles] = useState<string[]>(preTitles);
  const [selectedMode, setSelectedMode] = useState<QuizSelectableMode>('mix');
  const [setPickerOpen, setSetPickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();
  const { data: sets = [], isLoading } = useSets();
  const { data: cards = [], isLoading: cardsLoading } = useCardsForSets(selectedSetIds);
  const available = useMemo(() => supportedModes(cards), [cards]);

  const cycleSortOrder = () =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'cards' : 'newest');

  const filteredSets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? sets.filter(s => s.title.toLowerCase().includes(q)) : [...sets];
    return filtered.sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sets, search, sortOrder]);

  const chipModes = useMemo<QuizSelectableMode[]>(() => {
    if (selectedSetIds.length === 0 || cards.length === 0) return [];
    return ALL_SELECTABLE.filter(m => m === 'mix' || available.includes(m as any));
  }, [selectedSetIds, cards, available]);

  // Fix 5: reset mode when selected sets change and mode is no longer available
  useEffect(() => {
    if (chipModes.length > 0 && !chipModes.includes(selectedMode)) {
      setSelectedMode('mix');
    }
  }, [chipModes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (id: string, title: string) => {
    if (selectedSetIds.includes(id)) {
      const idx = selectedSetIds.indexOf(id);
      setSelectedSetIds(prev => prev.filter(x => x !== id));
      setSelectedSetTitles(prev => prev.filter((_, i) => i !== idx));
    } else {
      setSelectedSetIds(prev => [...prev, id]);
      setSelectedSetTitles(prev => [...prev, title]);
    }
  };

  const selectorLabel = selectedSetIds.length === 0
    ? 'Tap to choose sets…'
    : selectedSetIds.length === 1
    ? selectedSetTitles[0]
    : `${selectedSetIds.length} sets selected`;

  const canStart = selectedSetIds.length > 0 && cards.length > 0;

  return (
    <Screen
      header={<ScreenHeader title="New Quiz" onBack={() => navigation.goBack()} />}
      footer={
        <View style={styles.footer}>
          <Button
            label={cardsLoading ? 'Loading cards…' : 'Start Quiz'}
            onPress={() => navigation.navigate('Quiz', {
              setIds: selectedSetIds,
              setTitles: selectedSetTitles,
              mode: selectedMode,
              retakeAttemptId: params?.retakeAttemptId,
              quizName: quizName.trim() || undefined,
            })}
            disabled={!canStart || cardsLoading}
            fullWidth
          />
        </View>
      }
    >
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>

          {/* ── Quiz Name ── */}
          <View>
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>QUIZ NAME</Typography>
          <Input
            placeholder="e.g. Week 3 Review…"
            value={quizName}
            onChangeText={setQuizName}
            returnKeyType="done"
            containerStyle={{ marginBottom: spacing[5] }}
          />

          </View>

          {/* ── Choose Sets row ── */}
          <View>
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>CHOOSE SETS</Typography>
          <Pressable style={styles.selectorRow} onPress={() => setSetPickerOpen(true)} accessibilityRole="button">
            <View style={styles.selectorIcon}>
              {selectedSetIds.length > 0
                ? <CheckCircleIcon size={20} color={colors.primary} />
                : <ChevronRightIcon size={20} color={colors.textDisabled} />
              }
            </View>
            <Typography
              preset="body"
              color={selectedSetIds.length > 0 ? colors.textPrimary : colors.textSecondary}
              style={styles.flex}
              numberOfLines={1}
            >
              {selectorLabel}
            </Typography>
            <ChevronRightIcon size={18} color={colors.textSecondary} />
          </Pressable>

          </View>

          {/* ── Quiz Type chips ── */}
          {selectedSetIds.length > 0 && (cardsLoading || cards.length > 0) && (
            <View style={{ marginTop: spacing[6] }}>
              <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>QUIZ TYPE</Typography>
              {cardsLoading ? (
                <Typography preset="body" color={colors.textSecondary}>Loading modes…</Typography>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {chipModes.map(m => (
                      <FilterChip
                        key={m}
                        label={MODE_LABEL[m]}
                        active={m === selectedMode}
                        onPress={() => setSelectedMode(m)}
                        icon={m === 'mix' ? ShuffleIcon : undefined}
                      />
                    ))}
                  </ScrollView>
                  <Typography preset="body" color={colors.textSecondary} style={styles.modeDesc}>
                    {modeDesc[selectedMode]}
                  </Typography>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Set Picker Sheet ── */}
      <AppModal visible={setPickerOpen} onClose={() => setSetPickerOpen(false)} contentStyle={styles.sheetContent}>
        <View style={styles.sheetToolbar}>
          <Typography preset="h4" style={styles.flex}>Choose Sets</Typography>
          <Pressable onPress={toggleSearch} hitSlop={8} accessibilityRole="button">
            <SearchIcon size={20} color={searchVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
          <Pressable onPress={cycleSortOrder} hitSlop={8} style={styles.sortBtn} accessibilityRole="button">
            <SortIcon size={20} color={colors.primary} />
            <Typography preset="caption" color={colors.primary}>{SORT_LABEL[sortOrder]}</Typography>
          </Pressable>
        </View>

        {searchVisible && (
          <SearchBar
            placeholder="Search sets…"
            value={search}
            onChangeText={setSearch}
            autoFocus
            containerStyle={styles.sheetSearch}
          />
        )}

        {selectedSetIds.length > 0 && (
          <View style={styles.selectedBadge}>
            <Typography preset="caption" color={colors.primary}>
              {selectedSetIds.length} set{selectedSetIds.length > 1 ? 's' : ''} selected
            </Typography>
          </View>
        )}

        <FlatList
          data={filteredSets}
          keyExtractor={s => s.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.sheetList}
          ListEmptyComponent={
            !isLoading ? <EmptyState title="No sets found" subtitle="Create a set with cards to start quizzing" /> : null
          }
          renderItem={({ item }) => {
            const count = item._count?.cards ?? 0;
            const selected = selectedSetIds.includes(item.id);
            return (
              <Pressable
                style={[styles.setRow, selected && styles.setRowSelected]}
                onPress={() => handleToggle(item.id, item.title)}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <CheckCircleIcon size={18} color={colors.primary} />}
                </View>
                <View style={styles.flex}>
                  <Typography preset="h4" color={selected ? colors.primary : colors.textPrimary} numberOfLines={1}>
                    {item.title}
                  </Typography>
                  <Typography preset="caption" color={colors.textSecondary}>
                    {count === 0 ? 'No cards yet' : `${count} ${count === 1 ? 'card' : 'cards'}`}
                  </Typography>
                </View>
              </Pressable>
            );
          }}
        />

        <Button
          label={selectedSetIds.length === 0 ? 'Select sets to continue' : `Done — ${selectedSetIds.length} set${selectedSetIds.length > 1 ? 's' : ''}`}
          onPress={() => setSetPickerOpen(false)}
          disabled={selectedSetIds.length === 0}
          fullWidth
          style={styles.sheetDone}
        />
      </AppModal>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    section: { padding: layout.screenPaddingH },
    sectionLabel: { marginBottom: spacing[3], marginTop: spacing[2] },
    selectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: layout.cardRadiusSm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundCard,
    },
    selectorIcon: { width: 28, alignItems: 'center' },
    chipRow: { flexDirection: 'row', gap: spacing[2], paddingBottom: spacing[1] },
    modeDesc: { marginTop: spacing[3] },
    footer: {
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sheetContent: { maxHeight: '85%' },
    sheetToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      marginBottom: spacing[3],
    },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
    sheetSearch: { marginBottom: spacing[2] },
    selectedBadge: {
      paddingVertical: spacing[1],
      marginBottom: spacing[2],
    },
    sheetList: { flexShrink: 1 },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: layout.cardRadius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundCard,
      marginBottom: spacing[2],
    },
    setRowSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    checkbox: {
      width: spacing[6],
      height: spacing[6],
      borderRadius: layout.cardRadius,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: { borderColor: colors.primary },
    sheetDone: { marginTop: spacing[3] },
  });
