import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { PlusCircleIcon } from '../../../components/icons';
import { FormField } from '../../../components/forms';
import { Typography } from '../../../components/ui';
import { fontFamily, fontSizes, layout, spacing, useTheme } from '../../../theme';
import type { CardType } from '../../../types';

const ICON_SIZE = 20;

const COPY: Record<CardType, {
  qLabel: string; qPlaceholder: string; aLabel: string; aPlaceholder: string;
  noteBtn: string; noteLabel: string; notePlaceholder: string;
}> = {
  QA:    { qLabel: 'Question', qPlaceholder: 'Enter the question…', aLabel: 'Answer', aPlaceholder: 'Enter the answer…',
           noteBtn: 'Add Hint', noteLabel: 'Hint (optional)', notePlaceholder: 'Add a hint…' },
  STORY: { qLabel: 'Reference (optional)', qPlaceholder: 'e.g. John 3:16', aLabel: 'Text', aPlaceholder: 'Enter the verse or passage…',
           noteBtn: 'Add Note', noteLabel: 'Note (optional)', notePlaceholder: 'Add a note or reflection…' },
};

import i18n from '../../../i18n';

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

export interface CardFormHandle {
  submit: () => void;
}

interface CardFormProps {
  defaultValues?: { type?: CardType; question?: string; answer?: string; note?: string | null };
  onSubmit: (data: { type: CardType; question: string; answer: string; note: string }) => Promise<void>;
  onSubmittingChange?: (submitting: boolean) => void;
  /** Lock the card type — hides the tab switcher. Pass true when editing an existing card. */
  lockedType?: boolean;
}

import { useTranslation } from 'react-i18next';

export const CardForm = forwardRef<CardFormHandle, CardFormProps>(function CardForm(
  { defaultValues, onSubmit, onSubmittingChange, lockedType = false },
  ref,
) {
  const { t } = useTranslation(['library', 'common']);
  const { colors } = useTheme();

  const answerRef = useRef<TextInput>(null);
  const [noteExpanded, setNoteExpanded] = useState(!!defaultValues?.note);

  const { control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<CardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultValues?.type ?? 'QA',
      question: defaultValues?.question ?? '',
      answer: defaultValues?.answer ?? '',
      note: defaultValues?.note ?? '',
    },
  });

  const type = watch('type');
  const copy = COPY[type];

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(data => onSubmit({ ...data, note: data.note ?? '' })),
  }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  return (
    <View style={styles.flex}>
      {/* ── Card type switcher (hidden when editing an existing card) ── */}
      {!lockedType && (
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {(['QA', 'STORY'] as CardType[]).map(tType => (
            <Pressable
              key={tType}
              style={({ pressed }) => [styles.tab, { borderBottomColor: type === tType ? colors.accent : colors.transparent }, pressed && styles.btnPressed]}
              onPress={() => setValue('type', tType)}
            >
              <Typography preset="label" color={type === tType ? colors.accent : colors.textSecondary}>
                {tType === 'QA' ? t('library:cards.qaCard', 'Q&A Card') : t('library:cards.storyCard', 'Story Card')}
              </Typography>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formGap}>
          <FormField
            name="question"
            control={control}
            label={copy.qLabel}
            placeholder={copy.qPlaceholder}
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={type === 'QA' ? 300 : 100}
            onSubmitEditing={() => answerRef.current?.focus()}
          />
          <FormField
            name="answer"
            control={control}
            label={copy.aLabel}
            placeholder={copy.aPlaceholder}
            autoCapitalize="sentences"
            inputRef={answerRef}
            maxLength={type === 'QA' ? 1000 : 2000}
            multiline
            minHeight={type === 'STORY' ? 120 : 80}
          />

          {noteExpanded ? (
            <View>
              <View style={styles.noteLabelRow}>
                <Typography preset="label" color={colors.textSecondary}>{copy.noteLabel}</Typography>
                <Pressable
                  onPress={() => { setValue('note', ''); setNoteExpanded(false); }}
                  hitSlop={8}
                  style={({ pressed }) => pressed && styles.btnPressed}
                >
                  <Typography preset="caption" color={colors.textSecondary}>{t('common:actions.remove', 'Remove')}</Typography>
                </Pressable>
              </View>
              <Controller
                name="note"
                control={control}
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <>
                    <TextInput
                      style={[styles.noteInput, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
                      placeholder={copy.notePlaceholder}
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={3}
                      maxLength={500}
                      placeholderTextColor={colors.textSecondary}
                      autoCapitalize="sentences"
                    />
                    {error && (
                      <Typography preset="caption" color={colors.alert} style={styles.errorText}>
                        {error.message}
                      </Typography>
                    )}
                  </>
                )}
              />
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.addNoteBtn, { borderColor: colors.border }, pressed && styles.btnPressed]}
              onPress={() => setNoteExpanded(true)}
            >
              <View style={styles.addNoteBtnContent}>
                <PlusCircleIcon size={ICON_SIZE} color={colors.textSecondary} />
                <Typography preset="label" color={colors.textSecondary}>{copy.noteBtn}</Typography>
              </View>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: layout.screenPaddingH },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2 },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxxl },
  formGap: { gap: spacing.lg },
  noteLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addNoteBtn: { borderWidth: 1.5, borderRadius: layout.cardRadius, borderStyle: 'dashed', paddingVertical: spacing.md, alignItems: 'center' },
  noteInput: { borderRadius: layout.cardRadius, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: spacing.s80, textAlignVertical: 'top', fontSize: fontSizes.md, fontFamily: fontFamily.regular },
  errorText: { marginTop: spacing.xs },
  btnPressed: { opacity: 0.85 },
  addNoteBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
