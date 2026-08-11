import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm } from 'react-hook-form';
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

// Single schema for both types — question is required only for Q&A. Keeping `type`
// in the form (rather than remounting per type) preserves entered text when the
// user switches Q&A ↔ Story while editing.
const schema = z.object({
  type: z.enum(['QA', 'STORY']),
  question: z.string().trim().max(5000, 'Max 5000 characters'),
  answer: z.string().trim().max(5000, 'Max 5000 characters'),
}).superRefine((data, ctx) => {
  if (data.type === 'QA' && data.question.trim().length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['question'], message: 'Question is required' });
  }
  if (data.answer.trim().length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['answer'], message: data.type === 'STORY' ? 'Text is required' : 'Answer is required' });
  }
});

type CardFormData = z.infer<typeof schema>;

export interface CardFormHandle {
  /** Validate and, if valid, run the parent's onSubmit. */
  submit: () => void;
}

interface CardFormProps {
  defaultValues?: { type?: CardType; question?: string; answer?: string; note?: string | null };
  onSubmit: (data: { type: CardType; question: string; answer: string; note: string }) => Promise<void>;
  /** Notifies the parent so the pinned footer button can show a loading state. */
  onSubmittingChange?: (submitting: boolean) => void;
}

/** Shared Q&A / Story card form — used identically by Create and Edit. */
export const CardForm = forwardRef<CardFormHandle, CardFormProps>(function CardForm(
  { defaultValues, onSubmit, onSubmittingChange },
  ref,
) {
  const { colors } = useTheme();

  const answerRef = useRef<TextInput>(null);
  const [note, setNote] = useState(defaultValues?.note ?? '');
  const [noteExpanded, setNoteExpanded] = useState(!!defaultValues?.note);

  const { control, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<CardFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultValues?.type ?? 'QA',
      question: defaultValues?.question ?? '',
      answer: defaultValues?.answer ?? '',
    },
  });

  const type = watch('type');
  const copy = COPY[type];

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(data => onSubmit({ ...data, note: note.trim() })),
  }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  return (
    <View style={styles.flex}>
      {/* ── Card type switcher ── */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['QA', 'STORY'] as CardType[]).map(t => (
          <Pressable
            key={t}
            style={({ pressed }) => [styles.tab, { borderBottomColor: type === t ? colors.accent : colors.transparent }, pressed && styles.btnPressed]}
            onPress={() => setValue('type', t)}
          >
            <Typography preset="label" color={type === t ? colors.accent : colors.textSecondary}>
              {t === 'QA' ? 'Q&A Card' : 'Story Card'}
            </Typography>
          </Pressable>
        ))}
      </View>

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
            maxLength={5000}
            onSubmitEditing={() => answerRef.current?.focus()}
          />
          <FormField
            name="answer"
            control={control}
            label={copy.aLabel}
            placeholder={copy.aPlaceholder}
            autoCapitalize="sentences"
            inputRef={answerRef}
            maxLength={5000}
            multiline
            minHeight={type === 'STORY' ? 120 : 80}
          />

          {noteExpanded ? (
            <View>
              <View style={styles.noteLabelRow}>
                <Typography preset="label" color={colors.textSecondary}>{copy.noteLabel}</Typography>
                <Pressable onPress={() => { setNoteExpanded(false); setNote(''); }} hitSlop={8} style={({ pressed }) => pressed && styles.btnPressed}>
                  <Typography preset="caption" color={colors.textSecondary}>Remove</Typography>
                </Pressable>
              </View>
              <TextInput
                style={[styles.noteInput, { backgroundColor: colors.surfaceMuted, color: colors.textPrimary }]}
                placeholder={copy.notePlaceholder}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                maxLength={2000}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="sentences"
              />
            </View>
          ) : (
            <Pressable style={({ pressed }) => [styles.addNoteBtn, { borderColor: colors.border }, pressed && styles.btnPressed]} onPress={() => setNoteExpanded(true)}>
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
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2 },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing.xxxl },
  formGap: { gap: spacing.lg },
  noteLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  addNoteBtn: { borderWidth: 1.5, borderRadius: layout.cardRadius, borderStyle: 'dashed', paddingVertical: spacing.md, alignItems: 'center' },
  noteInput: { borderRadius: layout.cardRadius, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: spacing.s80, textAlignVertical: 'top', fontSize: fontSizes.md, fontFamily: fontFamily.regular },
  btnPressed: { opacity: 0.85 },
  addNoteBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
