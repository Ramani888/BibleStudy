import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ActionSheet, AppModal, ConfirmDialog, EmptyState } from '../../components/feedback';
import { Button, FilterChip, Screen, SearchBar, Typography } from '../../components/ui';
import { FormField } from '../../components/forms';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CheckCircleIcon, ChevronRightIcon, FileTextIcon, SearchIcon, SortIcon, StarIcon } from '../../components/icons';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '../../api';
import { useCreditBalance, useGenerateQuiz, useSearchToggle, useSets } from '../../hooks';
import { useAIChatAttachment } from '../../hooks/useAIChatAttachment';
import { storage } from '../../utils/storage';
import { useTheme, spacing, layout, CARD_FILL_LIGHT } from '../../theme';
import { quizSetupSchema, type QuizSetupFormData } from '../../utils/validators';

import { useTranslation } from 'react-i18next';
type SortOrder = 'newest' | 'alpha' | 'cards';
const SORT_LABEL: Record<SortOrder, string> = { newest: 'Recent', alpha: 'A–Z', cards: 'Cards' };
// Need ≥4 cards to reliably ground a 4-option MC quiz; fewer risks a "not enough
// questions" failure after the credit is spent, so we gate the button instead.
const MIN_SET_CARDS = 4;

/**
 * Quiz setup — AI generation only. Make a quiz from a typed topic or grounded in
 * the user's own sets. (The old manual "Practice" lane was removed; playing existing
 * cards now happens via Review-due and retake, which go straight to the Quiz screen.)
 */
export function QuizSetupScreen() {
  const { t } = useTranslation(['quiz', 'common']);
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const navigation = useNavigation<any>();

  const { control, handleSubmit, getValues } = useForm<QuizSetupFormData>({
    resolver: zodResolver(quizSetupSchema),
    defaultValues: { quizName: '', aiTopic: '' },
  });
  const generate = useGenerateQuiz();
  const { data: creditBalance } = useCreditBalance();
  const AI_QUIZ_COST = 2;

  // Reuse the AI-chat attachment machinery (device pick + upload, My Media picker,
  // credit gating, one-time content-policy gate) for the "A document" source.
  const goPaywall = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Paywall' }), [navigation]);
  const att = useAIChatAttachment(creditBalance?.balance ?? 0, goPaywall);

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

  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedSetTitles, setSelectedSetTitles] = useState<string[]>([]);
  const [aiSource, setAiSource] = useState<'topic' | 'sets' | 'media'>('topic');
  const [setPickerOpen, setSetPickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const { query: search, setQuery: setSearch, visible: searchVisible, toggle: toggleSearch } = useSearchToggle();
  const { data: sets = [], isLoading } = useSets();

  // Total cards across the selected sets — gate generation below the MC threshold.
  const selectedCardCount = useMemo(
    () => sets.reduce((n, s) => (selectedSetIds.includes(s.id) ? n + (s._count?.cards ?? 0) : n), 0),
    [sets, selectedSetIds],
  );
  const setsTooFew = aiSource === 'sets' && selectedSetIds.length > 0 && selectedCardCount < MIN_SET_CARDS;

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

  // Fire a generate request → route into the quiz on success. `save` carries the
  // name + source (topic OR sets) so the completed quiz is recorded with them.
  // AI quizzes default to Multiple Choice — cleanest UX for generated content.
  type GenArgs = {
    payload: { topic?: string; setIds?: string[]; mediaIds?: string[] };
    save: { quizName: string; topic?: string; setIds: string[]; setTitles: string[] };
  };
  // Pending generation held while we get the user's AI-data consent (Apple 5.1.2:
  // permission before any content is sent to a third-party AI provider).
  const [consentGen, setConsentGen] = useState<GenArgs | null>(null);

  const doGenerate = useCallback(({ payload, save }: GenArgs) => {
    if (generate.isPending) return;
    generate.mutate(payload, {
      onSuccess: ({ cards: generatedCards }) => {
        // Pop Setup off the tab stack first so finishing the quiz (Done / auto-exit /
        // Summary exit) lands on QuizHub, never back on this generate form.
        navigation.goBack();
        navigation.navigate('Quiz', { ...save, mode: 'mc', generatedCards });
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

  // Consent gate: nothing is sent to the AI until the user has accepted the
  // one-time AI-data notice. Already-accepted (chat/media) → generate straight away.
  const runGenerate = useCallback(async (payload: GenArgs['payload'], save: GenArgs['save']) => {
    if (generate.isPending) return;
    if (await storage.getAiPolicyAccepted()) doGenerate({ payload, save });
    else setConsentGen({ payload, save });
  }, [generate.isPending, doGenerate]);

  const acceptAiConsent = useCallback(async () => {
    await storage.setAiPolicyAccepted();
    const pending = consentGen;
    setConsentGen(null);
    if (pending) doGenerate(pending);
  }, [consentGen, doGenerate]);

  // AI quiz from a typed topic (validated via zod + handleSubmit). Name falls back
  // to the topic when the user leaves the name field blank.
  const generateFromTopic = handleSubmit(({ aiTopic, quizName }) => {
    const topic = aiTopic.trim();
    const name = quizName.trim() || topic;
    runGenerate({ topic }, { quizName: name, topic, setIds: [], setTitles: [name] });
  });

  // AI quiz grounded in the selected sets' cards. Name falls back to the set names.
  const generateFromSets = useCallback(() => {
    if (selectedSetIds.length === 0) return;
    const autoTitle = selectedSetTitles.length === 1
      ? selectedSetTitles[0]
      : t('library:plans.selectedCount', { count: selectedSetTitles.length, defaultValue: `${selectedSetTitles.length} sets` });
    const name = (getValues('quizName') || '').trim() || autoTitle;
    runGenerate({ setIds: selectedSetIds }, { quizName: name, setIds: selectedSetIds, setTitles: selectedSetTitles });
  }, [selectedSetIds, selectedSetTitles, runGenerate, getValues, t]);

  // AI quiz grounded in an uploaded document (PDF/image). Name falls back to the file name.
  const generateFromMedia = useCallback(() => {
    const file = att.attachment;
    if (!file) return;
    const name = (getValues('quizName') || '').trim() || file.name;
    runGenerate({ mediaIds: [file.id] }, { quizName: name, setIds: [], setTitles: [name] });
  }, [att.attachment, runGenerate, getValues]);

  // Document quizzes force paid Claude → media rate (image 3 / pdf 5). Before a
  // file is chosen we can't know which, so show the 3–5 range.
  const mediaCost = att.attachment?.type === 'PDF' ? 5 : 3;
  const shownCost = aiSource === 'media' ? mediaCost : AI_QUIZ_COST;
  const aiCostLabel = aiSource === 'media' && !att.attachment
    ? t('quiz:setup.aiCostMedia', 'Costs 3–5 credits · reads your document')
    : creditBalance !== undefined
      ? t('quiz:setup.aiCostWithBalance', { cost: shownCost, balance: creditBalance.balance, defaultValue: `Costs ${shownCost} credits · ${creditBalance.balance} left` })
      : t('quiz:setup.aiCost', { cost: shownCost, defaultValue: `Costs ${shownCost} credits` });

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

  const chooseDocumentBlock = (
    <View>
      <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.chooseDocumentLabel', 'CHOOSE A DOCUMENT')}</Typography>
      <Pressable
        style={({ pressed }) => [styles.selectorRow, { borderColor: colors.border, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }, pressed && styles.rowPressed]}
        onPress={att.handleAttachPress}
        accessibilityRole="button"
      >
        <View style={styles.selectorIcon}>
          {att.attachment
            ? <FileTextIcon size={20} color={colors.accent} />
            : <ChevronRightIcon size={20} color={colors.textDisabled} />}
        </View>
        <Typography preset="body" color={att.attachment ? colors.textPrimary : colors.textSecondary} style={styles.flex} numberOfLines={1}>
          {att.isUploading
            ? t('common:status.uploading', 'Uploading…')
            : att.attachment?.name ?? t('quiz:setup.tapToChooseDocument', 'Tap to upload a PDF or image…')}
        </Typography>
        {att.attachment
          ? <Pressable onPress={att.handleClearAttachment} hitSlop={8} style={({ pressed }) => pressed && styles.iconPressed}>
              <Typography preset="caption" color={colors.accent}>{t('common:actions.remove', 'Remove')}</Typography>
            </Pressable>
          : <ChevronRightIcon size={18} color={colors.textSecondary} />}
      </Pressable>
    </View>
  );

  return (
    <Screen
      header={<ScreenHeader title={t('quiz:setup.title')} onBack={() => navigation.goBack()} />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label={t('quiz:setup.generateAiQuiz', '✨ Generate AI Quiz')}
            loading={generate.isPending}
            onPress={aiSource === 'topic' ? generateFromTopic : aiSource === 'sets' ? generateFromSets : generateFromMedia}
            disabled={generate.isPending
              || (aiSource === 'sets' && (selectedSetIds.length === 0 || setsTooFew))
              || (aiSource === 'media' && (!att.attachment || att.isUploading))}
            fullWidth
          />
        </View>
      }
    >
      <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <View style={styles.nameField}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.nameLabel', 'QUIZ NAME')}</Typography>
            <FormField name="quizName" control={control} placeholder={t('quiz:setup.namePlaceholder', 'e.g. Week 3 Review…')} autoCapitalize="sentences" returnKeyType="next" maxLength={80} />
          </View>

          <View style={styles.nameField}>
            <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.aiSourceLabel', 'GENERATE FROM')}</Typography>
            <View style={styles.chipRow}>
              <FilterChip label={t('quiz:setup.aiSource.topic', 'A topic')} active={aiSource === 'topic'} onPress={() => setAiSource('topic')} />
              <FilterChip label={t('quiz:setup.aiSource.sets', 'My sets')} active={aiSource === 'sets'} onPress={() => setAiSource('sets')} />
              <FilterChip label={t('quiz:setup.aiSource.document', 'A document')} active={aiSource === 'media'} onPress={() => setAiSource('media')} />
            </View>
          </View>

          {aiSource === 'topic' ? (
            <View>
              <Typography preset="caption" color={colors.textSecondary} style={styles.sectionLabel}>{t('quiz:setup.topicLabel', 'TOPIC')}</Typography>
              <FormField name="aiTopic" control={control} placeholder={t('quiz:setup.aiTopicPlaceholder', 'Enter a topic — e.g. Gospel of John')} autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={generateFromTopic} maxLength={100} />
            </View>
          ) : aiSource === 'sets' ? (
            chooseSetsBlock
          ) : (
            chooseDocumentBlock
          )}

          <View style={styles.aiCostRow}>
            <StarIcon size={12} color={colors.textSecondary} />
            <Typography preset="caption" color={colors.textSecondary}>{aiCostLabel}</Typography>
          </View>

          {setsTooFew && (
            <View style={styles.aiCostRow}>
              <Typography preset="caption" color={colors.alert} align="center">
                {t('quiz:setup.tooFewCards', { count: MIN_SET_CARDS, defaultValue: `Pick sets with at least ${MIN_SET_CARDS} cards total to generate a quiz.` })}
              </Typography>
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

      {/* ── AI generation loading overlay (the 5–15s wait) ── */}
      <AppModal visible={generate.isPending} contentStyle={styles.genModal}>
        <View style={styles.genWrap}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Typography preset="h4" align="center">{t('quiz:setup.generatingTitle', 'Building your quiz…')}</Typography>
          <Typography preset="body" color={colors.textSecondary} align="center">{genMessages[genMsgIdx]}</Typography>
        </View>
      </AppModal>

      {/* ── Document source: attach menu + My Media picker + content-policy gate ── */}
      <ActionSheet visible={att.attachMenuVisible} title={att.isUploading ? t('common:status.uploading', 'Uploading…') : t('quiz:setup.attachDocument', 'Add a document')} actions={att.attachMenuActions} onClose={() => att.setAttachMenuVisible(false)} />
      <ActionSheet visible={att.pickerVisible} title={t('ai:chat.chooseMedia', 'Choose from My Media')} actions={att.pickerActions} onClose={() => att.setPickerVisible(false)} />
      <ConfirmDialog
        visible={att.policyDialogVisible}
        title={t('ai:chat.contentPolicy', 'Content Policy')}
        message={t('ai:chat.contentPolicyMsg', 'Please keep attachments appropriate.\n\nDo not upload sexual, violent, or illegal content. Violations may result in account suspension.\n\nBy continuing, you agree to our content guidelines.')}
        confirmLabel={t('common:actions.agree', 'I Agree')}
        cancelLabel={t('common:actions.cancel', 'Cancel')}
        onConfirm={att.acceptPolicy}
        onCancel={() => att.setPolicyDialogVisible(false)}
      />

      {/* AI data notice — permission before any content is sent to a third-party AI (Apple 5.1.2) */}
      <ConfirmDialog
        visible={!!consentGen}
        title={t('ai:consent.title', 'AI Chat')}
        message={t('ai:consent.shortNotice', 'The questions you type and any file you attach are sent to our AI providers (OpenRouter and Anthropic) to generate results. Continue?')}
        confirmLabel={t('common:actions.agree', 'I Agree')}
        cancelLabel={t('common:actions.cancel', 'Cancel')}
        onConfirm={acceptAiConsent}
        onCancel={() => setConsentGen(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { padding: layout.screenPaddingH },
  sectionLabel: { marginBottom: spacing.md, marginTop: spacing.sm },
  nameField: { marginBottom: spacing.xl },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: layout.cardRadiusSm,
    borderWidth: 1,
  },
  selectorIcon: { width: spacing.s28, alignItems: 'center' },
  aiCostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md },
  genModal: { alignItems: 'center' },
  genWrap: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
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
