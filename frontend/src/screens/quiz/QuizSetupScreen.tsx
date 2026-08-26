import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { AppModal, EmptyState } from '../../components/feedback';
import { Button, FilterChip, Input, Screen, SearchBar, Typography } from '../../components/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ChevronRightIcon, SearchIcon, ShuffleIcon, SortIcon } from '../../components/icons';
import { useSearchToggle, useSets } from '../../hooks';
import { supportedModes } from '../../hooks/useQuizSession';
import { useCardsForSets } from '../../hooks';
import { useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import type { QuizSelectableMode } from '../../types';
import type { QuizStackParamList } from '../../navigation/types';

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
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
  const available = supportedModes(cards);

  const cycleSortOrder = useCallback(() =>
    setSortOrder(s => s === 'newest' ? 'alpha' : s === 'alpha' ? 'cards' : 'newest'), []);

  const openSetPicker  = useCallback(() => setSetPickerOpen(true), []);
  const closeSetPicker = useCallback(() => setSetPickerOpen(false), []);

  const filteredSets = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? sets.filter(s => s.title.toLowerCase().includes(q)) : [...sets];
    return filtered.sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sets, search, sortOrder]);

  const chipModes = useMemo(() => {
    if (selectedSetIds.length === 0 || cards.length === 0) return [] as QuizSelectableMode[];
    return ALL_SELECTABLE.filter(m => m === 'mix' || available.includes(m as any));
  }, [selectedSetIds.length, cards.length, available]);

  // reset mode when selected sets change and mode is no longer available
  useEffect(() => {
    if (chipModes.length > 0 && !chipModes.includes(selectedMode)) {
      setSelectedMode('mix');
    }
  }, [chipModes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback((id: string, title: string) => {
    if (selectedSetIds.includes(id)) {
      const idx = selectedSetIds.indexOf(id);
      setSelectedSetIds(prev => prev.filter(x => x !== id));
      setSelectedSetTitles(prev => prev.filter((_, i) => i !== idx));
    } else {
      setSelectedSetIds(prev => [...prev, id]);
      setSelectedSetTitles(prev => [...prev, title]);
    }
  }, [selectedSetIds]);

  const renderSetRow = useCallback(({ item }: { item: typeof filteredSets[number] }) => {
    const count = item._count?.cards ?? 0;
    const selected = selectedSetIds.includes(item.id);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.setRow,
          { borderColor: colors.border, backgroundColor: colors.surface },
          selected && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
          pressed && styles.rowPressed,
        ]}
        onPress={() => handleToggle(item.id, item.title)}
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, selected && { borderColor: colors.accent }]}>
          {selected && <CheckCircleIcon size={18} color={colors.accent} />}
        </View>
        <View style={styles.flex}>
          <Typography preset="h4" color={selected ? colors.accent : colors.textPrimary} numberOfLines={1}>
            {item.title}
          </Typography>
          <Typography preset="caption" color={colors.textSecondary}>
            {count === 0 ? t('library:cards.noCards', 'No cards yet') : t('library:cards.cardCount', { count, defaultValue: `${count} cards` })}
          </Typography>
        </View>
      </Pressable>
    );
  }, [selectedSetIds, colors, handleToggle, t]);

  const selectorLabel = selectedSetIds.length === 0
    ? t('quiz:setup.tapToChooseSets', 'Tap to choose sets…')
    : selectedSetIds.length === 1
    ? selectedSetTitles[0]
    : t('library:plans.selectedCount', { count: selectedSetIds.length, defaultValue: `${selectedSetIds.length} sets selected` });

  const canStart = selectedSetIds.length > 0 && cards.length > 0;

  return (
    <Screen
      header={<ScreenHeader title={t('quiz:setup.title')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label={
              cardsLoading ? t('quiz:setup.loadingCards', 'Loading cards…')
              : selectedSetIds.length > 0 && cards.length === 0 ? t('quiz:setup.noCardsInSets', 'No cards in selected sets')
              : t('quiz:setup.startQuiz', 'Start Quiz')
            }
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
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.nameLabel', 'QUIZ NAME')}</Typography>
          <Input
            placeholder={t('quiz:setup.namePlaceholder', 'e.g. Week 3 Review…')}
            value={quizName}
            onChangeText={setQuizName}
            returnKeyType="done"
            containerStyle={{ marginBottom: spacing.xl }}
          />

          </View>

          {/* ── Choose Sets row ── */}
          <View>
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.chooseSetsLabel', 'CHOOSE SETS')}</Typography>
          <Pressable
            style={({ pressed }) => [styles.selectorRow, { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, pressed && styles.rowPressed]}
            onPress={openSetPicker}
            accessibilityRole="button"
          >
            <View style={styles.selectorIcon}>
              {selectedSetIds.length > 0
                ? <CheckCircleIcon size={20} color={colors.accent} />
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
            <View style={styles.modeSection}>
              <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.quizTypeLabel', 'QUIZ TYPE')}</Typography>
              {cardsLoading ? (
                <Typography preset="body" color={colors.textSecondary}>{t('common:status.loading', 'Loading modes…')}</Typography>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {chipModes.map(m => (
                      <FilterChip
                        key={m}
                        label={t(`quiz:modes.${m}`, MODE_LABEL[m])}
                        active={m === selectedMode}
                        onPress={() => setSelectedMode(m)}
                        icon={m === 'mix' ? ShuffleIcon : undefined}
                      />
                    ))}
                  </ScrollView>
                  <Typography preset="body" color={colors.textSecondary} style={styles.modeDesc}>
                    {t(`quiz:setup.modeDesc.${selectedMode}`, modeDesc[selectedMode])}
                  </Typography>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Set Picker Sheet ── */}
      <AppModal visible={setPickerOpen} onClose={closeSetPicker} contentStyle={styles.sheetContent}>
        <View style={styles.sheetToolbar}>
          <Typography preset="h4" style={styles.flex}>{t('library:sets.chooseSets', 'Choose Sets')}</Typography>
          <Pressable
            style={({ pressed }) => pressed && styles.iconPressed}
            onPress={toggleSearch}
            hitSlop={8}
            accessibilityRole="button"
          >
            <SearchIcon size={20} color={searchVisible ? colors.accent : colors.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.sortBtn, pressed && styles.iconPressed]}
            onPress={cycleSortOrder}
            hitSlop={8}
            accessibilityRole="button"
          >
            <SortIcon size={20} color={colors.accent} />
            <Typography preset="caption" color={colors.accent}>{t(`quiz:setup.sort.${sortOrder}`, SORT_LABEL[sortOrder])}</Typography>
          </Pressable>
        </View>

        {searchVisible && (
          <SearchBar
            placeholder={t('library:sets.searchPlaceholder', 'Search sets…')}
            value={search}
            onChangeText={setSearch}
            autoFocus
            containerStyle={styles.sheetSearch}
          />
        )}

        {selectedSetIds.length > 0 && (
          <View style={styles.selectedBadge}>
            <Typography preset="caption" color={colors.accent}>
              {t('library:plans.selectedCount', { count: selectedSetIds.length, defaultValue: `${selectedSetIds.length} sets selected` })}
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
            isLoading
              ? <View style={styles.modalLoading}><ActivityIndicator color={colors.accent} /></View>
              : <EmptyState title={t('common:status.noResults', 'No sets found')} subtitle={t('quiz:setup.noSetsSub', 'Create a set with cards to start quizzing')} />
          }
          renderItem={renderSetRow}
        />

        <Button
          label={selectedSetIds.length === 0 ? t('quiz:setup.selectSetsToContinue', 'Select sets to continue') : t('common:actions.doneCount', { count: selectedSetIds.length, defaultValue: `Done — ${selectedSetIds.length} sets` })}
          onPress={closeSetPicker}
          disabled={selectedSetIds.length === 0}
          fullWidth
          style={styles.sheetDone}
        />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { padding: layout.screenPaddingH },
  sectionLabel: { marginBottom: spacing.md, marginTop: spacing.sm },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadiusSm,
    borderWidth: 1,
  },
  selectorIcon: { width: spacing.s28, alignItems: 'center' },
  modeSection: { marginTop: spacing.xxl },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  modeDesc: { marginTop: spacing.md },
  rowPressed: { opacity: 0.7 },
  iconPressed: { opacity: 0.85 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
  sheetContent: { maxHeight: '85%' },
  sheetToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sheetSearch: { marginBottom: spacing.sm },
  selectedBadge: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  sheetList: { flexShrink: 1 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: layout.cardRadius,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetDone: { marginTop: spacing.md },
  modalLoading: { paddingVertical: spacing.xxxl, alignItems: 'center' },
});
