import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import {
  QMBackButton, QMButton, QMConfirmDialog, QMFormField, QMSearchField, QMSegmented, QMSheet, QMSortChip, type QMSheetAction,
} from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { CardsIcon, CheckIcon, ChevronRightIcon, DocIcon, InfoIcon, SparklesIcon } from '../../components/icons';
import { getErrorMessage } from '../../api';
import { useCreditBalance, useGenerateQuiz, useSets } from '../../hooks';
import { useAIChatAttachment } from '../../hooks/useAIChatAttachment';
import { GeneratingQuizModal } from './components';
import { storage } from '../../utils/storage';
import { useTheme, spacing, radius, qmAccent } from '../../theme';
import { quizSetupSchema, type QuizSetupFormData } from '../../utils/validators';

type Source = 'topic' | 'sets' | 'media';
type SortOrder = 'newest' | 'alpha' | 'cards';
const SORTS: SortOrder[] = ['newest', 'alpha', 'cards'];
// Need ≥4 cards to reliably ground a 4-option MC quiz; fewer risks a "not enough
// questions" failure after the credit is spent, so we gate the button instead.
const MIN_SET_CARDS = 4;
const AI_QUIZ_COST = 2;
const PICK_ROW_H = 60;
const PICK_BAR_W = 12;
const PICK_BAR_H = 36;
const CHECK = 26;
const TILE = 34;
const SOURCE_MIN_H = 58;

/**
 * Quiz setup — AI generation only. Make a quiz from a typed topic, grounded in the
 * user's own sets, or from a document. (Playing existing cards happens via
 * Review-due and retake, which go straight to the Quiz screen.)
 */
export function QuizSetupScreen() {
  const { t } = useTranslation(['quiz', 'library', 'ai', 'common']);
  const { qm, name: themeName } = useTheme();
  const dark = themeName === 'dark';
  const insets = useSafeAreaInsets();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cross-tab Paywall + root-stack Quiz routes
  const navigation = useNavigation<any>();

  const { control, handleSubmit, getValues } = useForm<QuizSetupFormData>({
    resolver: zodResolver(quizSetupSchema),
    defaultValues: { quizName: '', aiTopic: '' },
  });
  const generate = useGenerateQuiz();
  const { data: creditBalance } = useCreditBalance();
  const balance = creditBalance?.balance;

  // Reuse the AI-chat attachment machinery (device pick + upload, My Media picker,
  // credit gating, one-time content-policy gate) for the "A document" source.
  const goPaywall = useCallback(() => navigation.navigate('ProfileTab', { screen: 'Paywall' }), [navigation]);
  const att = useAIChatAttachment(balance ?? 0, goPaywall);

  const [source, setSource] = useState<Source>('topic');
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [search, setSearch] = useState('');
  const { data: sets = [], isLoading } = useSets();

  const setById = useMemo(() => new Map(sets.map(s => [s.id, s])), [sets]);
  const selectedTitles = selectedSetIds.map(id => setById.get(id)?.title ?? '');
  // Total cards across the selected sets — gate generation below the MC threshold.
  const selectedCardCount = selectedSetIds.reduce((n, id) => n + (setById.get(id)?._count?.cards ?? 0), 0);
  const setsTooFew = source === 'sets' && selectedSetIds.length > 0 && selectedCardCount < MIN_SET_CARDS;

  const pickList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (q ? sets.filter(s => s.title.toLowerCase().includes(q)) : [...sets]).sort((a, b) => {
      if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
      if (sortOrder === 'cards') return (b._count?.cards ?? 0) - (a._count?.cards ?? 0);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sets, search, sortOrder]);

  const toggleSet = useCallback((id: string) => {
    setSelectedSetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

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
          goPaywall();
          return;
        }
        Toast.show({ type: 'error', text1: t('quiz:setup.couldNotGenerate', "Couldn't generate quiz"), text2: getErrorMessage(err) });
      },
    });
  }, [generate, navigation, goPaywall, t]);

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
  const generateFromSets = () => {
    if (selectedSetIds.length === 0) return;
    const autoTitle = selectedTitles.length === 1
      ? selectedTitles[0]
      : t('library:plans.selectedCount', { count: selectedTitles.length, defaultValue: `${selectedTitles.length} sets` });
    const name = (getValues('quizName') || '').trim() || autoTitle;
    runGenerate({ setIds: selectedSetIds }, { quizName: name, setIds: selectedSetIds, setTitles: selectedTitles });
  };

  // AI quiz grounded in an uploaded document (PDF/image). Name falls back to the file name.
  const generateFromMedia = () => {
    const file = att.attachment;
    if (!file) return;
    const name = (getValues('quizName') || '').trim() || file.name;
    runGenerate({ mediaIds: [file.id] }, { quizName: name, setIds: [], setTitles: [name] });
  };

  // Document quizzes force paid Claude → media rate (image 3 / pdf 5). Before a
  // file is chosen we can't know which, so show the 3–5 range.
  const cost = source === 'media' ? (att.attachment ? (att.attachment.type === 'PDF' ? 5 : 3) : null) : AI_QUIZ_COST;
  const lacking = balance !== undefined && balance < (cost ?? 3);
  const incomplete = (source === 'sets' && (selectedSetIds.length === 0 || setsTooFew))
    || (source === 'media' && (!att.attachment || att.isUploading));
  const off = incomplete || lacking;
  const onMake = lacking ? goPaywall : source === 'topic' ? generateFromTopic : source === 'sets' ? generateFromSets : generateFromMedia;

  const consentWhat = consentGen?.payload.topic ? t('quiz:qm.whatTopic', 'your topic')
    : consentGen?.payload.setIds ? t('quiz:qm.whatSets', 'the cards in the sets you chose')
    : t('quiz:qm.whatDoc', 'your document');

  const attachActions: QMSheetAction[] = att.attachMenuActions.map(a => ({
    label: a.label, icon: a.icon ?? DocIcon, onPress: a.onPress, off: 'disabled' in a && a.disabled,
  }));
  const mediaActions: QMSheetAction[] = att.pickerActions.map(a => ({
    label: a.label, icon: a.icon ?? DocIcon, onPress: a.onPress, off: 'disabled' in a && a.disabled,
  }));

  const sortLabel = sortOrder === 'newest' ? t('common:sort.recent', 'Recent')
    : sortOrder === 'alpha' ? t('library:qm.sortAZ', 'A to Z') : t('library:qm.sortMostCards', 'Most cards');
  const n = selectedSetIds.length;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.sm }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <QMBackButton onPress={() => navigation.goBack()} label={t('common:actions.back', 'Back')} />
        <Typography preset="qmPageTitle" color={qm.ink} style={styles.title}>{t('quiz:qm.newQuiz', 'New quiz')}</Typography>
        <Typography preset="qmBodyMd" color={qm.muted}>
          {t('quiz:qm.setupLead', 'Tell Verdance what to ask about. It writes 8 multiple-choice questions for you.')}
        </Typography>

        <Typography preset="qmFieldLabel" color={qm.body} style={styles.label}>{t('quiz:qm.makeFrom', 'Make it from')}</Typography>
        <QMSegmented
          label={t('quiz:qm.makeFrom', 'Make it from')}
          value={source}
          onChange={setSource}
          options={[
            { key: 'topic', label: t('quiz:setup.aiSource.topic', 'A topic') },
            { key: 'sets', label: t('quiz:setup.aiSource.sets', 'My sets') },
            { key: 'media', label: t('quiz:setup.aiSource.document', 'A document') },
          ]}
        />

        <Animated.View key={source} entering={FadeIn.duration(220)} style={styles.block}>
          {source === 'topic' && (
            <View>
              <QMFormField
                name="aiTopic"
                control={control}
                label={t('quiz:qm.topic', 'Topic')}
                placeholder={t('quiz:qm.topicPlaceholder', 'e.g. Gospel of John')}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={generateFromTopic}
                maxLength={100}
              />
              <Typography preset="qmMeta" color={qm.muted} style={styles.help}>{t('quiz:qm.topicHelp', 'A book, a person, a theme. 2 to 100 characters.')}</Typography>
            </View>
          )}

          {source === 'sets' && (
            <View>
              <Typography preset="qmFieldLabel" color={qm.body}>{t('quiz:qm.yourSets', 'Your sets')}</Typography>
              <SourceButton
                tileBg={qm.lilac}
                icon={<CardsIcon size={18} color={qm.link} />}
                title={n === 0 ? t('quiz:qm.chooseSets', 'Choose sets') : n === 1 ? selectedTitles[0] : t('quiz:qm.setsChosen', { count: n, defaultValue: `${n} sets chosen` })}
                sub={n === 0 ? t('quiz:qm.tapToPick', 'Tap to pick one or more') : t('quiz:qm.cardsToAsk', { count: selectedCardCount, defaultValue: `${selectedCardCount} cards to ask from` })}
                onPress={() => setPickerOpen(true)}
                trailing={<ChevronRightIcon size={18} color={qm.muted} />}
              />
              {setsTooFew && (
                <View style={[styles.warn, { backgroundColor: qm.errorBg }]} accessibilityRole="alert">
                  <InfoIcon size={18} color={qm.warm} strokeWidth={2} />
                  <Typography preset="qmBody" color={qm.warm} style={styles.flex}>
                    {t('quiz:qm.tooFew', { count: selectedCardCount, min: MIN_SET_CARDS, defaultValue: `These sets have ${selectedCardCount} cards. Pick sets with at least ${MIN_SET_CARDS} cards in total.` })}
                  </Typography>
                </View>
              )}
            </View>
          )}

          {source === 'media' && (
            <View>
              <Typography preset="qmFieldLabel" color={qm.body}>{t('quiz:qm.pdfOrPhoto', 'A PDF or photo')}</Typography>
              <SourceButton
                tileBg={qm.goldBg}
                icon={<DocIcon size={18} color={qm.goldText} />}
                dashed={!att.attachment}
                title={att.isUploading ? t('common:status.uploading', 'Uploading…') : att.attachment?.name ?? t('quiz:qm.addDoc', 'Add a PDF or photo')}
                sub={att.attachment
                  ? att.attachment.type === 'PDF' ? t('quiz:qm.pdfCost', 'PDF · 5 credits') : t('quiz:qm.photoCost', 'Photo · 3 credits')
                  : t('quiz:qm.docSub', 'Verdance reads it and asks about it')}
                onPress={att.handleAttachPress}
                trailing={att.isUploading
                  ? <ActivityIndicator size="small" color={qm.violet} />
                  : att.attachment
                    ? (
                      <Pressable onPress={att.handleClearAttachment} hitSlop={10} accessibilityRole="button">
                        <Typography preset="qmLink" color={qm.link}>{t('common:actions.remove', 'Remove')}</Typography>
                      </Pressable>
                    )
                    : null}
              />
            </View>
          )}
        </Animated.View>

        <View style={styles.nameBlock}>
          <QMFormField
            name="quizName"
            control={control}
            label={t('quiz:qm.quizName', 'Quiz name')}
            optional={t('library:qm.optional', '(optional)')}
            placeholder={t('quiz:qm.namePlaceholder', 'e.g. Week 3 review')}
            autoCapitalize="sentences"
            returnKeyType="done"
            maxLength={80}
          />
          <Typography preset="qmMeta" color={qm.muted} style={styles.help}>{t('quiz:qm.nameHelp', 'Leave it empty and we will name it after the topic.')}</Typography>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: qm.bg, borderTopColor: qm.hair }]}>
        <QMButton
          icon={SparklesIcon}
          label={t('quiz:qm.makeMyQuiz', 'Make my quiz')}
          badge={cost === null ? t('quiz:qm.costRange', '3 to 5 credits') : t('quiz:qm.costCredits', { count: cost })}
          onPress={onMake}
          off={off}
          pressableWhenOff={lacking && !incomplete}
          loading={generate.isPending}
        />
        {lacking ? (
          <Typography preset="qmLabel" color={qm.warm} align="center" style={styles.hint} accessibilityRole="alert">
            {t('quiz:qm.lackLine', { cost: cost ?? t('quiz:qm.threeToFive', '3 to 5'), defaultValue: `Not enough credits — this quiz costs ${cost}.` })}{' '}
            <Typography preset="qmLabel" color={qm.link} onPress={goPaywall} accessibilityRole="link">{t('quiz:qm.getCredits', 'Get credits')}</Typography>
          </Typography>
        ) : balance !== undefined ? (
          <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.hint}>
            {t('quiz:qm.balance', { count: balance, defaultValue: `You have ${balance} credits` })}
          </Typography>
        ) : null}
      </View>

      {/* ── Set picker ── */}
      <QMSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.pickHead}>
          <Typography preset="qmSheetTitle" color={qm.ink}>{t('quiz:qm.chooseSets', 'Choose sets')}</Typography>
          <QMSortChip label={sortLabel} onPress={() => setSortOrder(s => SORTS[(SORTS.indexOf(s) + 1) % SORTS.length])} />
        </View>
        <View style={styles.pickSearch}>
          <QMSearchField value={search} onChangeText={setSearch} placeholder={t('quiz:qm.searchSets', 'Search sets')} />
        </View>
        {isLoading ? (
          <ActivityIndicator color={qm.violet} style={styles.pickLoading} />
        ) : pickList.length === 0 ? (
          <Typography preset="qmBodyMd" color={qm.muted} align="center" style={styles.pickLoading}>
            {sets.length === 0 ? t('quiz:setup.noSetsSub', 'Create a set with cards to start quizzing') : t('quiz:qm.noSetsMatch', 'No sets match')}
          </Typography>
        ) : pickList.map(s => {
          const on = selectedSetIds.includes(s.id);
          const count = s._count?.cards ?? 0;
          return (
            <Pressable
              key={s.id}
              onPress={() => toggleSet(s.id)}
              style={[styles.pickRow, { borderBottomColor: qm.hair }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={s.title}
            >
              <View style={[styles.pickBar, { backgroundColor: qmAccent(qm, dark, s.color)[1] }]} />
              <View style={styles.flex}>
                <Typography preset="qmRow" color={qm.ink} numberOfLines={1}>{s.title}</Typography>
                <Typography preset="qmMeta" color={qm.muted} style={styles.pickMeta}>
                  {count === 0 ? t('library:cards.noCards', 'No cards yet') : t('library:cards.cardCount', { count })}
                </Typography>
              </View>
              <View style={[styles.check, on ? { backgroundColor: qm.violet } : { borderWidth: 2, borderColor: qm.off }]}>
                {on && <CheckIcon size={16} color={qm.onViolet} strokeWidth={3} />}
              </View>
            </Pressable>
          );
        })}
        <QMButton
          label={n === 0 ? t('quiz:qm.pickOne', 'Pick at least one set') : t('quiz:qm.doneSets', { count: n, defaultValue: `Done, ${n} sets` })}
          onPress={() => setPickerOpen(false)}
          off={n === 0}
          style={styles.pickDone}
        />
      </QMSheet>

      {/* ── Document source: attach menu + My Media picker + content-policy gate ── */}
      <QMSheet
        visible={att.attachMenuVisible}
        onClose={() => att.setAttachMenuVisible(false)}
        title={att.isUploading ? t('common:status.uploading', 'Uploading…') : t('quiz:setup.attachDocument', 'Add a document')}
        actions={attachActions}
        note={balance !== undefined ? t('quiz:qm.attachNote', { balance, defaultValue: `A photo costs 3 credits, a PDF costs 5. You have ${balance}.` }) : undefined}
      />
      <QMSheet
        visible={att.pickerVisible}
        onClose={() => att.setPickerVisible(false)}
        title={t('ai:chat.chooseMedia', 'Choose from My Media')}
        actions={mediaActions}
      />
      <QMConfirmDialog
        visible={att.policyDialogVisible}
        title={t('quiz:qm.policyTitle', 'Before you add a document')}
        message={t('quiz:qm.policyText', 'Only upload things you have the right to use, and keep them appropriate: nothing sexual, violent or illegal. Breaking this can get your account suspended.')}
        confirmLabel={t('quiz:qm.agree', 'I agree')}
        cancelLabel={t('quiz:qm.notNow', 'Not now')}
        onConfirm={att.acceptPolicy}
        onCancel={() => att.setPolicyDialogVisible(false)}
      />

      {/* AI data notice — permission before any content is sent to a third-party AI (Apple 5.1.2) */}
      <QMConfirmDialog
        visible={!!consentGen}
        title={t('quiz:qm.consentTitle', 'Before we make your quiz')}
        message={t('quiz:qm.consentText', { what: consentWhat, defaultValue: `To write your questions, Verdance sends ${consentWhat} to outside AI providers (OpenRouter and Anthropic). We only ask once.` })}
        confirmLabel={t('quiz:qm.agree', 'I agree')}
        cancelLabel={t('quiz:qm.notNow', 'Not now')}
        onConfirm={acceptAiConsent}
        onCancel={() => setConsentGen(null)}
      />

      <GeneratingQuizModal visible={generate.isPending} />
    </View>
  );
}

function SourceButton({ tileBg, icon, title, sub, onPress, trailing, dashed }: {
  tileBg: string; icon: React.ReactNode; title: string; sub: string; onPress: () => void; trailing?: React.ReactNode; dashed?: boolean;
}) {
  const { qm } = useTheme();
  return (
    <AnimatedPressable
      scaleTo={0.98}
      onPress={onPress}
      style={[
        styles.source,
        { backgroundColor: qm.surface },
        dashed ? { borderWidth: 1.5, borderColor: qm.off } : { boxShadow: `${qm.cardShadow}, inset 0px 0px 0px 1px ${qm.hair}` },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.tile, { backgroundColor: tileBg }]}>{icon}</View>
      <View style={styles.flex}>
        <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{title}</Typography>
        <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.pickMeta}>{sub}</Typography>
      </View>
      {trailing}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  label: { marginTop: spacing.xxl, marginBottom: spacing.sm },
  block: { marginTop: spacing.xl },
  help: { marginTop: spacing.s6 },
  nameBlock: { marginTop: spacing.xxl },
  source: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm,
    minHeight: SOURCE_MIN_H, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md,
  },
  tile: { width: TILE, height: TILE, borderRadius: radius.r10, alignItems: 'center', justifyContent: 'center' },
  warn: {
    flexDirection: 'row', gap: spacing.s10, marginTop: spacing.s10,
    paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r12 + 2,
  },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.s14, borderTopWidth: 1 },
  hint: { marginTop: spacing.sm },
  pickHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickSearch: { marginTop: spacing.md, marginBottom: spacing.sm },
  pickLoading: { marginVertical: spacing.xxl },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, minHeight: PICK_ROW_H, borderBottomWidth: StyleSheet.hairlineWidth },
  pickBar: { width: PICK_BAR_W, height: PICK_BAR_H, borderRadius: radius.r6 },
  pickMeta: { marginTop: spacing.s2 },
  check: { width: CHECK, height: CHECK, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  pickDone: { marginTop: spacing.s14 },
});
