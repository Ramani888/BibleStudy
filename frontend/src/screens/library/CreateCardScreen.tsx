import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { PlusCircleIcon } from '../../components/icons';
import { CardPreview } from './components/CardPreview';
import { FormField } from '../../components/forms';
import { Button, Screen, ScreenHeader, Spacer, Typography } from '../../components/ui';

import { useCreateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';
import type { CardType } from '../../types';

const ICON_SIZE = 20;

const COPY: Record<CardType, { qLabel: string; qPlaceholder: string; aLabel: string; aPlaceholder: string }> = {
  QA:    { qLabel: 'Question', qPlaceholder: 'Enter the question…', aLabel: 'Answer', aPlaceholder: 'Enter the answer…' },
  STORY: { qLabel: 'Reference (optional)', qPlaceholder: 'e.g. John 3:16', aLabel: 'Text', aPlaceholder: 'Enter the verse or passage…' },
};

function makeSchema(type: CardType) {
  return z.object({
    question:
      type === 'QA'
        ? z.string().trim().min(1, 'Question is required').max(5000, 'Max 5000 characters')
        : z.string().trim().max(5000, 'Max 5000 characters'),
    answer: z
      .string()
      .trim()
      .min(1, type === 'STORY' ? 'Text is required' : 'Answer is required')
      .max(5000, 'Max 5000 characters'),
  });
}

// ─── Card form (Q&A or Story) ─────────────────────────────────────────────────
export interface CardFormHandle {
  /** Save the card and leave the screen. */
  submit: () => void;
}

const CardForm = forwardRef<CardFormHandle, {
  setId: string;
  type: CardType;
  onSaved: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}>(function CardForm({ setId, type, onSaved, onSubmittingChange }, ref) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const answerRef = useRef<TextInput>(null);
  const { mutateAsync: createCard } = useCreateCard();
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const copy = COPY[type];

  const schema = useMemo(() => makeSchema(type), [type]);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<{ question: string; answer: string }>({
    resolver: zodResolver(schema),
    defaultValues: { question: '', answer: '' },
  });

  const questionValue = useWatch({ control, name: 'question' });
  const answerValue   = useWatch({ control, name: 'answer' });

  useImperativeHandle(ref, () => ({
    submit: handleSubmit(d => save(d)),
  }));

  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  const save = async (data: { question: string; answer: string }) => {
    try {
      await createCard({ setId, type, ...data, note: note.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Card added!' });
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  return (
    <View style={styles.formGap}>
      <CardPreview question={questionValue || ''} answer={answerValue || ''} />

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
        returnKeyType="done"
        maxLength={5000}
        multiline={type === 'STORY'}
        onSubmitEditing={type === 'STORY' ? undefined : handleSubmit(d => save(d))}
      />

      {noteExpanded ? (
        <View>
          <View style={styles.noteLabelRow}>
            <Typography preset="label" color={colors.textSecondary}>Note (optional)</Typography>
            <Pressable onPress={() => { setNoteExpanded(false); setNote(''); }} hitSlop={8}>
              <Typography preset="caption" color={colors.textSecondary}>Remove</Typography>
            </Pressable>
          </View>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a hint or note…"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            maxLength={2000}
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="sentences"
          />
        </View>
      ) : (
        <Pressable style={styles.addNoteBtn} onPress={() => setNoteExpanded(true)}>
          <View style={styles.addNoteBtnContent}>
            <PlusCircleIcon size={ICON_SIZE} color={colors.textSecondary} />
            <Typography preset="label" color={colors.textSecondary}>Add Note</Typography>
          </View>
        </Pressable>
      )}

    </View>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { setId } = route.params;
  const [type, setType] = useState<CardType>('QA');
  const formRef = useRef<CardFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  const header = (
    <ScreenHeader title="Add Cards" handle />
  );

  const footer = (
    <View style={styles.footer}>
      <Button label="Add Card" onPress={() => formRef.current?.submit()} loading={submitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      {/* ── Card type switcher ── */}
      <View style={styles.tabs}>
        {(['QA', 'STORY'] as CardType[]).map(t => (
          <Pressable key={t} style={[styles.tab, type === t && styles.tabActive]} onPress={() => setType(t)}>
            <Typography preset="label" color={type === t ? theme.colors.primary : theme.colors.textSecondary}>
              {t === 'QA' ? 'Q&A Card' : 'Story Card'}
            </Typography>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CardForm key={type} ref={formRef} setId={setId} type={type} onSaved={() => navigation.goBack()} onSubmittingChange={setSubmitting} />
        <Spacer size={theme.spacing[8]} />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.transparent },
    tabActive: { borderBottomColor: colors.primary },
    scroll: { padding: layout.screenPaddingH },
    formGap: { gap: spacing[4] },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    noteLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
    addNoteBtn: { borderWidth: 1.5, borderRadius: 12, borderColor: colors.border, borderStyle: 'dashed', paddingVertical: spacing[3], alignItems: 'center' },
    noteInput: { borderWidth: 1.5, borderRadius: 12, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 80, color: colors.textPrimary, textAlignVertical: 'top' },
    addNoteBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  });
