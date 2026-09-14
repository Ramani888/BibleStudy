import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AppModal, EmptyState } from '../../components/feedback';
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
import type { MediaFile, QuizSelectableMode } from '../../types';
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

// One form, three sources: practice existing cards, generate from a topic, or from a file.
type SetupMode = 'practice' | 'ai' | 'file';
const SETUP_MODES: SetupMode[] = ['practice', 'ai', 'file'];
const SETUP_MODE_LABEL: Record<SetupMode, string> = { practice: 'Practice', ai: 'Quiz by AI', file: 'PDF / Image' };

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
  const [mode, setMode] = useState<SetupMode>('practice');
  const [aiSource, setAiSource] = useState<'topic' | 'sets'>('topic');
  const [fileKind, setFileKind] = useState<'pdf' | 'image'>('pdf');
  const [pickedFile, setPickedFile] = useState<MediaFile | null>(null);
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

  // AI quiz from a typed topic (validated via zod + handleSubmit).
  const generateFromTopic = handleSubmit(({ aiTopic }) => {
    const topic = aiTopic.trim();
    runGenerate({ topic }, topic);
  });

  // AI quiz grounded in the selected sets' cards.
  const generateFromSets = useCallback(() => {
    if (selectedSetIds.length === 0) return;
    const title = selectedSetTitles.length === 1
      ? selectedSetTitles[0]
      : t('library:plans.selectedCount', { count: selectedSetTitles.length, defaultValue: `${selectedSetTitles.length} sets` });
    runGenerate({ setIds: selectedSetIds }, title);
  }, [selectedSetIds, selectedSetTitles, runGenerate, t]);

  // Quiz from an uploaded PDF/image (media rate: 3–5 credits). Pick first — the
  // chosen file shows in a field — then generate as a separate step.
  const changeFileKind = useCallback((kind: 'pdf' | 'image') => {
    setFileKind(kind);
    setPickedFile(null);
  }, []);
  const pickFile = useCallback(async () => {
    const file = fileKind === 'pdf' ? await pickPdf() : await pickImage();
    if (file) setPickedFile(file);
  }, [fileKind, pickPdf, pickImage]);
  const generateFromFile = useCallback(() => {
    if (!pickedFile) return;
    runGenerate({ mediaIds: [pickedFile.id] }, pickedFile.name);
  }, [pickedFile, runGenerate]);

  const startPractice = useCallback(() => navigation.navigate('Quiz', {
    setIds: selectedSetIds,
    setTitles: selectedSetTitles,
    mode: selectedMode,
    retakeAttemptId: params?.retakeAttemptId,
    quizName: getValues('quizName').trim() || undefined,
  }), [navigation, selectedSetIds, selectedSetTitles, selectedMode, params?.retakeAttemptId, getValues]);

  // Cost hint reused by the AI + file lanes (media is charged at a higher rate).
  const aiCostLabel = creditBalance !== undefined
    ? t('quiz:setup.aiCostWithBalance', { cost: AI_QUIZ_COST, balance: creditBalance.balance, defaultValue: `Costs ${AI_QUIZ_COST} credits · ${creditBalance.balance} left` })
    : t('quiz:setup.aiCost', { cost: AI_QUIZ_COST, defaultValue: `Costs ${AI_QUIZ_COST} credits` });
  const costRow = (label: string) => (
    <View style={styles.aiCostRow}>
      <StarIcon size={12} color={colors.textSecondary} />
      <Typography preset="caption" color={colors.textSecondary}>{label}</Typography>
    </View>
  );

  // Choose-sets selector — shared by Practice and the AI "My sets" source.
  const chooseSetsBlock = (
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
            : <ChevronRightIcon size={20} color={colors.textDisabled} />}
        </View>
        <Typography preset="body" color={selectedSetIds.length > 0 ? colors.textPrimary : colors.textSecondary} style={styles.flex} numberOfLines={1}>
          {selectorLabel}
        </Typography>
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <Screen
      header={<ScreenHeader title={t('quiz:setup.title')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {mode === 'practice' ? (
            <Button
              label={selectedSetIds.length > 0 && cards.length === 0 && !cardsLoading
                ? t('quiz:setup.noCardsInSets', 'No cards in selected sets')
                : t('quiz:setup.startQuiz', 'Start Quiz')}
              loading={cardsLoading}
              onPress={startPractice}
              disabled={!canStart}
              fullWidth
            />
          ) : mode === 'ai' ? (
            <Button
              label={t('quiz:setup.generateAiQuiz', '✨ Generate AI Quiz')}
              loading={generate.isPending}
              onPress={aiSource === 'topic' ? generateFromTopic : generateFromSets}
              disabled={generate.isPending || (aiSource === 'sets' && selectedSetIds.length === 0)}
              fullWidth
            />
          ) : (
            <Button
              label={t('quiz:setup.generateQuiz', '✨ Generate Quiz')}
              loading={generate.isPending}
              onPress={generateFromFile}
              disabled={generate.isPending || isUploading || !pickedFile}
              fullWidth
            />
          )}
        </View>
      }
    >
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>

          {/* ── Mode chooser: one form, three sources ── */}
          <View style={styles.tabRow}>
            {SETUP_MODES.map(m => (
              <FilterChip
                key={m}
                label={t(`quiz:setup.tab.${m}`, SETUP_MODE_LABEL[m])}
                active={m === mode}
                onPress={() => setMode(m)}
              />
            ))}
          </View>

          {/* ── PRACTICE: quiz existing cards ── */}
          {mode === 'practice' && (
            <>
              <View style={styles.nameField}>
                <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.nameLabel', 'QUIZ NAME')}</Typography>
                <FormField name="quizName" control={control} placeholder={t('quiz:setup.namePlaceholder', 'e.g. Week 3 Review…')} autoCapitalize="sentences" returnKeyType="done" maxLength={80} />
              </View>

              {chooseSetsBlock}

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
            </>
          )}

          {/* ── QUIZ BY AI: generate from a topic OR the selected sets ── */}
          {mode === 'ai' && (
            <>
              <View style={styles.nameField}>
                <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.nameLabel', 'QUIZ NAME')}</Typography>
                <FormField name="quizName" control={control} placeholder={t('quiz:setup.namePlaceholder', 'e.g. Week 3 Review…')} autoCapitalize="sentences" returnKeyType="next" maxLength={80} />
              </View>

              <View style={styles.nameField}>
                <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.aiSourceLabel', 'GENERATE FROM')}</Typography>
                <View style={styles.chipRow}>
                  <FilterChip label={t('quiz:setup.aiSource.topic', 'A topic')} active={aiSource === 'topic'} onPress={() => setAiSource('topic')} />
                  <FilterChip label={t('quiz:setup.aiSource.sets', 'My sets')} active={aiSource === 'sets'} onPress={() => setAiSource('sets')} />
                </View>
              </View>

              {aiSource === 'topic' ? (
                <View>
                  <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.topicLabel', 'TOPIC')}</Typography>
                  <FormField name="aiTopic" control={control} placeholder={t('quiz:setup.aiTopicPlaceholder', 'Enter a topic — e.g. Gospel of John')} autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={generateFromTopic} maxLength={100} />
                </View>
              ) : (
                chooseSetsBlock
              )}
              {costRow(aiCostLabel)}
            </>
          )}

          {/* ── PDF / IMAGE: generate from an uploaded file ── */}
          {mode === 'file' && (
            <>
              <View style={styles.nameField}>
                <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.fileSourceLabel', 'SOURCE')}</Typography>
                <View style={styles.chipRow}>
                  <FilterChip label={t('quiz:setup.fileKindPdf', 'PDF')} active={fileKind === 'pdf'} onPress={() => changeFileKind('pdf')} />
                  <FilterChip label={t('quiz:setup.fileKindImage', 'Image')} active={fileKind === 'image'} onPress={() => changeFileKind('image')} />
                </View>
              </View>

              <View>
                <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.fileLabel', 'FILE')}</Typography>
                <Pressable
                  style={({ pressed }) => [styles.selectorRow, { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, pressed && styles.rowPressed]}
                  onPress={pickFile}
                  disabled={isUploading}
                  accessibilityRole="button"
                >
                  <View style={styles.selectorIcon}>
                    {isUploading
                      ? <ActivityIndicator color={colors.accent} />
                      : pickedFile
                      ? <CheckCircleIcon size={20} color={colors.accent} />
                      : <ChevronRightIcon size={20} color={colors.textDisabled} />}
                  </View>
                  <Typography preset="body" color={pickedFile ? colors.textPrimary : colors.textSecondary} style={styles.flex} numberOfLines={1}>
                    {pickedFile
                      ? pickedFile.name
                      : fileKind === 'pdf'
                      ? t('quiz:setup.tapToChoosePdf', 'Tap to choose a PDF…')
                      : t('quiz:setup.tapToChooseImage', 'Tap to choose an image…')}
                  </Typography>
                  <ChevronRightIcon size={18} color={colors.textSecondary} />
                </Pressable>
                <Typography preset="body" color={colors.textSecondary} style={styles.modeDesc}>
                  {t('quiz:setup.fileHelp', "We'll read your file and build a quiz from it.")}
                </Typography>
              </View>
              {costRow(t('quiz:setup.fileCost', 'Costs 3–5 credits · media'))}
            </>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { padding: layout.screenPaddingH },
  sectionLabel: { marginBottom: spacing.md, marginTop: spacing.sm },
  nameField: { marginBottom: spacing.xl },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
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
