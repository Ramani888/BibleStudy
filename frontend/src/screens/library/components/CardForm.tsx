import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { PlusIcon } from '../../../components/icons';
import { QMFormField, QMSegmented } from '../../../components/qm';
import { Typography } from '../../../components/ui';
import { useTheme, spacing, radius, textPresets, qmFont } from '../../../theme';
import i18n from '../../../i18n';
import type { CardType } from '../../../types';

const PREVIEW_H = 170;
const EXTRA_BTN_H = 48;

const schema = z.object({
  type: z.enum(['QA', 'STORY']),
  question: z.string().trim(),
  answer: z.string().trim(),
  note: z.string().trim().max(500, i18n.t('library:validation.noteMax', 'Max 500 characters')).optional(),
}).superRefine((data, ctx) => {
  const isQA = data.type === 'QA';
  const q = data.question.trim();
  const a = data.answer.trim();

  // Question: required + min 2 for Q&A; optional but capped for Story (reference)
  if (isQA) {
    if (q.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['question'], message: i18n.t('library:validation.questionMin', 'Question must be at least 2 characters') });
    if (q.length > 300) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['question'], message: i18n.t('library:validation.questionMax', 'Max 300 characters') });
  } else {
    if (q.length > 100) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['question'], message: i18n.t('library:validation.referenceMax', 'Reference must be 100 characters or less') });
  }

  // Answer / Text: required + min 2 for both types; max differs by type
  if (a.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answer'], message: isQA ? i18n.t('library:validation.answerMin', 'Answer must be at least 2 characters') : i18n.t('library:validation.textMin', 'Text must be at least 2 characters') });
  if (isQA && a.length > 1000) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answer'], message: i18n.t('library:validation.answerMax', 'Max 1000 characters') });
  if (!isQA && a.length > 2000) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answer'], message: i18n.t('library:validation.textMax', 'Max 2000 characters') });
});

type CardFormData = z.infer<typeof schema>;
type CardValues = { type: CardType; question: string; answer: string; note: string };

export interface CardFormHandle {
  /** `next` = "Add & next": on success the form clears (keeping the type) instead of closing. */
  submit: (next?: boolean) => void;
}

interface CardFormProps {
  defaultValues?: { type?: CardType; question?: string; answer?: string; note?: string | null };
  onSubmit: (data: CardValues, next: boolean) => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Lock the card type — hides the type switch. Pass true when editing an existing card. */
  lockedType?: boolean;
}

export const CardForm = forwardRef<CardFormHandle, CardFormProps>(function CardForm(
  { defaultValues, onSubmit, onSubmittingChange, lockedType = false },
  ref,
) {
  const { t } = useTranslation(['library', 'common']);
  const { qm } = useTheme();
  const questionRef = useRef<TextInput>(null);
  const answerRef = useRef<TextInput>(null);
  const [noteExpanded, setNoteExpanded] = useState(!!defaultValues?.note);

  const { control, handleSubmit, watch, setValue, reset, trigger, formState: { isSubmitting, isSubmitted } } = useForm<CardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultValues?.type ?? 'QA',
      question: defaultValues?.question ?? '',
      answer: defaultValues?.answer ?? '',
      note: defaultValues?.note ?? '',
    },
  });
  const type = watch('type');
  const question = watch('question') ?? '';
  const answer = watch('answer') ?? '';
  const qa = type === 'QA';

  // Flip preview
  const flip = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const toggleFlip = () => { flip.value = withTiming(flipped ? 0 : 180, { duration: 400 }); setFlipped(f => !f); };
  const unflip = () => { if (flipped) { flip.value = withTiming(0, { duration: 400 }); setFlipped(false); } };
  const frontStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${flip.value}deg` }] }));
  const backStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${flip.value + 180}deg` }] }));

  useImperativeHandle(ref, () => ({
    submit: (next = false) => handleSubmit(async data => {
      await onSubmit({ ...data, note: data.note ?? '' }, next);
      if (next) {
        reset({ type: data.type, question: '', answer: '', note: '' });
        setNoteExpanded(false);
        unflip();
        questionRef.current?.focus();
      }
    })().catch(() => {}), // the screen already toasted the failure; keep the form filled
  }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const frontLabel = qa ? t('library:qm.question', 'Question') : t('library:qm.reference', 'Reference');
  const backLabel = qa ? t('library:qm.answer', 'Answer') : t('library:qm.passage', 'Passage');
  const extraLabel = qa ? t('library:qm.hint', 'Hint') : t('library:qm.note', 'Note');

  return (
    <View>
      {!lockedType && (
        <View style={styles.typeSwitch}>
          <QMSegmented
            label={t('library:qm.cardType', 'Card type')}
            value={type}
            // Re-check after a failed save so Q&A errors don't linger on a Story card (and vice versa).
            onChange={v => { setValue('type', v); if (isSubmitted) trigger(); unflip(); }}
            options={[
              { key: 'QA', label: t('library:qm.qaCard', 'Q&A card') },
              { key: 'STORY', label: t('library:qm.storyCardType', 'Story card') },
            ]}
          />
        </View>
      )}

      <Pressable onPress={toggleFlip} style={styles.preview} accessibilityRole="button" accessibilityLabel={t('library:qm.flipPreview', 'Flip the preview card')}>
        <Animated.View style={[styles.face, { boxShadow: qm.cardShadow }, frontStyle]}>
          <LinearGradient colors={[...qm.verse]} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
          <Typography preset="qmChip" color={qm.link}>{frontLabel}</Typography>
          <View style={styles.faceBody}>
            <Typography preset="qmVerse" color={question.trim() ? qm.verseInk : qm.muted} numberOfLines={3} style={styles.frontText}>
              {question.trim() || (qa ? t('library:qm.previewQ', 'Your question appears here') : t('library:qm.previewRef', 'Your reference appears here'))}
            </Typography>
          </View>
          <Typography preset="qmCaption" color={qm.muted}>{t('library:qm.tapFlip', 'Tap to flip')}</Typography>
        </Animated.View>
        <Animated.View style={[styles.face, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }, backStyle]}>
          <Typography preset="qmChip" color={qm.muted}>{backLabel}</Typography>
          <View style={styles.faceBody}>
            <Typography preset="qmLead" color={answer.trim() ? qm.body : qm.muted} numberOfLines={4}>
              {answer.trim() || (qa ? t('library:qm.previewA', 'Your answer appears here') : t('library:qm.previewPassage', 'Your passage appears here'))}
            </Typography>
          </View>
          <Typography preset="qmCaption" color={qm.muted}>{t('library:qm.tapFlipBack', 'Tap to flip back')}</Typography>
        </Animated.View>
      </Pressable>

      <View style={styles.fields}>
        <QMFormField
          name="question"
          control={control}
          inputRef={questionRef}
          label={frontLabel}
          optional={qa ? undefined : t('library:qm.optional', '(optional)')}
          placeholder={t('library:cards.questionPlaceholder', 'e.g. John 3:16')}
          autoCapitalize="sentences"
          returnKeyType="next"
          maxLength={qa ? 300 : 100}
          onFocus={unflip}
          onSubmitEditing={() => answerRef.current?.focus()}
        />
        <QMFormField
          name="answer"
          control={control}
          inputRef={answerRef}
          label={backLabel}
          counter={`${answer.length} / ${qa ? 1000 : 2000}`}
          placeholder={qa ? t('library:cards.answerPlaceholder', 'e.g. For God so loved the world…') : t('library:qm.passagePlaceholder', 'Enter the Scripture passage…')}
          autoCapitalize="sentences"
          multiline
          maxLength={qa ? 1000 : 2000}
          style={qa ? styles.answerQA : styles.answerStory}
        />

        {noteExpanded ? (
          <Animated.View entering={FadeInUp.duration(350)} style={styles.extra}>
            <View style={styles.extraHead}>
              <Typography preset="qmFieldLabel" color={qm.ink}>
                {extraLabel}
                <Typography preset="qmBody" color={qm.muted}>{` ${t('library:qm.optional', '(optional)')}`}</Typography>
              </Typography>
              <Pressable onPress={() => { setValue('note', ''); setNoteExpanded(false); }} hitSlop={10} accessibilityRole="button">
                <Typography preset="qmBody" color={qm.muted}>{t('common:actions.remove', 'Remove')}</Typography>
              </Pressable>
            </View>
            <Controller
              name="note"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <>
                  <TextInput
                    autoFocus
                    style={[styles.extraInput, { backgroundColor: qm.lilac, color: qm.ink }]}
                    placeholder={qa ? t('library:qm.hintPlaceholder', 'A small memory clue…') : t('library:cards.notePlaceholder', 'Write your note here…')}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    maxLength={500}
                    placeholderTextColor={qm.muted}
                    autoCapitalize="sentences"
                    accessibilityLabel={extraLabel}
                  />
                  {error ? <Typography preset="qmError" color={qm.error}>{error.message}</Typography> : null}
                </>
              )}
            />
          </Animated.View>
        ) : (
          <Pressable
            onPress={() => setNoteExpanded(true)}
            style={({ pressed }) => [styles.extraBtn, { borderColor: qm.line }, pressed && styles.dim]}
            accessibilityRole="button"
          >
            <PlusIcon size={16} color={qm.link} strokeWidth={2} />
            <Typography preset="qmButton" color={qm.link}>{qa ? t('library:qm.addHint', 'Add a hint') : t('library:qm.addNoteBtn', 'Add a note')}</Typography>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dim: { opacity: 0.6 },
  typeSwitch: { marginBottom: spacing.s18 },
  preview: { height: PREVIEW_H },
  face: {
    ...StyleSheet.absoluteFillObject, borderRadius: radius.r21 + 1, overflow: 'hidden', padding: spacing.s18,
    backfaceVisibility: 'hidden',
  },
  faceBody: { flex: 1, justifyContent: 'center' },
  frontText: { fontSize: 21, lineHeight: 28 },
  fields: { gap: spacing.lg, marginTop: spacing.xl },
  answerQA: { minHeight: 96 },
  answerStory: { minHeight: 160, fontFamily: qmFont.serif, lineHeight: 26 },
  extra: { gap: spacing.s6 },
  extraHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extraInput: {
    minHeight: 64, paddingHorizontal: spacing.s14, paddingVertical: spacing.md, borderRadius: radius.r12 + 2,
    textAlignVertical: 'top', ...textPresets.qmInput, fontSize: 15,
  },
  extraBtn: {
    height: EXTRA_BTN_H, borderRadius: radius.r12 + 2, borderWidth: 1.5, borderStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s6,
  },
});
