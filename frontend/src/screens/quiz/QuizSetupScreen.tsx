import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ActionSheet, AppModal, EmptyState } from '../../components/feedback';
import { Button, FilterChip, Screen, SearchBar, Typography } from '../../components/ui';
import { FormField } from '../../components/forms';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ChevronRightIcon, SearchIcon, ShuffleIcon, SortIcon, StarIcon } from '../../components/icons';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '../../api';
import { useCreditBalance, useGenerateQuiz, usePickMedia, useSearchToggle, useSets } from '../../hooks';
import { supportedModes } from '../../hooks/useQuizSession';
import { useCardsForSets } from '../../hooks';
import { useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import type { QuizSelectableMode } from '../../types';
import { quizSetupSchema, type QuizSetupFormData } from '../../utils/validators';
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

  const { control, handleSubmit, getValues } = useForm<QuizSetupFormData>({
    resolver: zodResolver(quizSetupSchema),
    defaultValues: { quizName: '', aiTopic: '' },
  });
  const generate = useGenerateQuiz();
  const { data: creditBalance } = useCreditBalance();
  const { pickPdf, pickImage, isUploading } = usePickMedia();
  const AI_QUIZ_COST = 2;

  // Rotating reassurance while the LLM works (the 5–15s where users bail).
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const genMessages = [
    t('quiz:setup.generating.writing', 'Writing your questions…'),
    t('quiz:setup.generating.grounding', 'Grounding them in scripture…'),
    t('quiz:setup.generating.almost', 'Almost ready…'),
  ];
  useEffect(() => {
    if (!generate.isPending) { setGenMsgIdx(0); return; }
    const id = setInterval(() => setGenMsgIdx(i => (i + 1) % genMessages.length), 1800);
    return () => clearInterval(id);
  }, [generate.isPending]); // eslint-disable-line react-hooks/exhaustive-deps
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

  // Shared: fire a generate request → route into the ephemeral quiz on success.
  // AI quizzes default to Multiple Choice — cleanest UX for generated content.
  const runGenerate = useCallback((payload: { topic?: string; setIds?: string[]; mediaIds?: string[] }, title: string) => {
    if (generate.isPending) return;
    generate.mutate(payload, {
      onSuccess: ({ cards: generatedCards }) => {
        navigation.navigate('Quiz', { setIds: [], setTitles: [title], mode: 'mc', quizName: title, generatedCards });
      },
      onError: (err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 402) {
          Toast.show({ type: 'error', text1: t('quiz:setup.outOfCredits', 'Out of credits'), text2: t('quiz:setup.upgradeToGenerate', 'Upgrade to generate AI quizzes.') });
          navigation.navigate('ProfileTab', { screen: 'Paywall' });
          return;
        }
        Toast.show({ type: 'error', text1: t('quiz:setup.couldNotGenerate', "Couldn't generate quiz"), text2: getErrorMessage(err) });
      },
    });
  }, [generate, navigation, t]);

  // Sets win over topic: with sets selected, ground the AI quiz in them (skips
  // topic validation); otherwise validate + use the typed topic via handleSubmit.
  const generateFromSets = useCallback(() => {
    const title = selectedSetTitles.length === 1
      ? selectedSetTitles[0]
      : t('library:plans.selectedCount', { count: selectedSetTitles.length, defaultValue: `${selectedSetTitles.length} sets` });
    runGenerate({ setIds: selectedSetIds }, title);
  }, [selectedSetIds, selectedSetTitles, runGenerate, t]);

  const generateFromTopic = handleSubmit(({ aiTopic }) => {
    const topic = aiTopic.trim();
    runGenerate({ topic }, topic);
  });

  const onGenerateAI = canStart ? generateFromSets : generateFromTopic;

  // Quiz from an uploaded PDF/image (media rate: 3–5 credits).
  const [fileSheetOpen, setFileSheetOpen] = useState(false);
  const handleGenerateFromFile = useCallback(async (kind: 'pdf' | 'image') => {
    setFileSheetOpen(false);
    const file = kind === 'pdf' ? await pickPdf() : await pickImage();
    if (!file) return;
    runGenerate({ mediaIds: [file.id] }, t('quiz:setup.fileQuizTitle', 'File quiz'));
  }, [pickPdf, pickImage, runGenerate, t]);

  return (
    <Screen
      header={<ScreenHeader title={t('quiz:setup.title')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label={
              selectedSetIds.length > 0 && cards.length === 0 && !cardsLoading ? t('quiz:setup.noCardsInSets', 'No cards in selected sets')
              : t('quiz:setup.startQuiz', 'Start Quiz')
            }
            loading={cardsLoading}
            onPress={() => navigation.navigate('Quiz', {
              setIds: selectedSetIds,
              setTitles: selectedSetTitles,
              mode: selectedMode,
              retakeAttemptId: params?.retakeAttemptId,
              quizName: getValues('quizName').trim() || undefined,
            })}
            disabled={!canStart}
            fullWidth
          />
        </View>
      }
    >
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>

          {/* ── Quiz Name ── */}
          <View style={styles.nameField}>
          <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.nameLabel', 'QUIZ NAME')}</Typography>
          <FormField
            name="quizName"
            control={control}
            placeholder={t('quiz:setup.namePlaceholder', 'e.g. Week 3 Review…')}
            autoCapitalize="sentences"
            returnKeyType="done"
            maxLength={80}
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
                <ActivityIndicator color={colors.accent} />
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

          {/* ── Or generate with AI (grounded in selected sets, else a topic) ── */}
          <View style={styles.modeSection}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.aiLabel', 'OR GENERATE WITH AI')}</Typography>
            {!canStart && (
              <View style={styles.topicField}>
                <FormField
                  name="aiTopic"
                  control={control}
                  placeholder={t('quiz:setup.aiTopicPlaceholder', 'Enter a topic — e.g. Gospel of John')}
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  onSubmitEditing={generateFromTopic}
                  maxLength={100}
                />
              </View>
            )}
            <Button
              label={canStart
                ? t('quiz:setup.generateAiQuizFromSets', '✨ Generate AI Quiz from selected sets')
                : t('quiz:setup.generateAiQuiz', '✨ Generate AI Quiz')}
              loading={generate.isPending}
              onPress={onGenerateAI}
              disabled={generate.isPending}
              fullWidth
            />
            <View style={styles.aiCostRow}>
              <StarIcon size={12} color={colors.textSecondary} />
              <Typography preset="caption" color={colors.textSecondary}>
                {creditBalance !== undefined
                  ? t('quiz:setup.aiCostWithBalance', { cost: AI_QUIZ_COST, balance: creditBalance.balance, defaultValue: `Costs ${AI_QUIZ_COST} credits · ${creditBalance.balance} left` })
                  : t('quiz:setup.aiCost', { cost: AI_QUIZ_COST, defaultValue: `Costs ${AI_QUIZ_COST} credits` })}
              </Typography>
            </View>
            <Button
              label={t('quiz:setup.generateFromFile', '📎 Quiz from a PDF or image')}
              variant="ghost"
              onPress={() => setFileSheetOpen(true)}
              disabled={generate.isPending || isUploading}
              fullWidth
            />
          </View>
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

      {/* ── AI generation loading overlay (upload + the 5–15s wait) ── */}
      <AppModal visible={generate.isPending || isUploading} contentStyle={styles.genModal}>
        <View style={styles.genWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Typography preset="h4" align="center">
            {isUploading ? t('quiz:setup.uploadingFile', 'Uploading file…') : t('quiz:setup.generatingTitle', 'Building your quiz…')}
          </Typography>
          {!isUploading && <Typography preset="body" color={colors.textSecondary} align="center">{genMessages[genMsgIdx]}</Typography>}
        </View>
      </AppModal>

      {/* ── Quiz-from-file source picker ── */}
      <ActionSheet
        visible={fileSheetOpen}
        title={t('quiz:setup.generateFromFile', '📎 Quiz from a PDF or image')}
        onClose={() => setFileSheetOpen(false)}
        actions={[
          { label: t('quiz:setup.choosePdf', 'Choose PDF'), onPress: () => handleGenerateFromFile('pdf') },
          { label: t('quiz:setup.chooseImage', 'Choose image'), onPress: () => handleGenerateFromFile('image') },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { padding: layout.screenPaddingH },
  sectionLabel: { marginBottom: spacing.md, marginTop: spacing.sm },
  nameField: { marginBottom: spacing.xl },
  topicField: { marginBottom: spacing.md },
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
  aiCostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  genModal: { alignItems: 'center' },
  genWrap: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
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
