import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { CardPreview } from './components/CardPreview';
import { FormField } from '../../components/forms';
import { Button, Spacer, Typography } from '../../components/ui';

import { useCreateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
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
function CardForm({ setId, type, onSaved }: { setId: string; type: CardType; onSaved: () => void }) {
  const answerRef = useRef<TextInput>(null);
  const { mutateAsync: createCard } = useCreateCard();
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);
  const copy = COPY[type];

  const schema = useMemo(() => makeSchema(type), [type]);
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ question: string; answer: string }>({
    resolver: zodResolver(schema),
    defaultValues: { question: '', answer: '' },
  });

  const questionValue = useWatch({ control, name: 'question' });
  const answerValue   = useWatch({ control, name: 'answer' });

  const save = async (data: { question: string; answer: string }, exit: boolean) => {
    try {
      await createCard({ setId, type, ...data, note: note.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Card added!', text2: exit ? undefined : 'Add another or go back' });
      if (exit) return onSaved();
      setNote('');
      setNoteExpanded(false);
      reset();
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
        onSubmitEditing={type === 'STORY' ? undefined : handleSubmit(d => save(d, false))}
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
            <Icon name="add-circle-outline" size={ICON_SIZE} color={colors.textSecondary} />
            <Typography preset="label" color={colors.textSecondary}>Add Note</Typography>
          </View>
        </Pressable>
      )}

      <View style={styles.btnRow}>
        <Button label="Add & Continue" variant="secondary" onPress={handleSubmit(d => save(d, false))} loading={isSubmitting} style={styles.flex} />
        <Button label="Done" onPress={handleSubmit(d => save(d, true))} loading={isSubmitting} style={styles.flex} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const { setId } = route.params;
  const [type, setType] = useState<CardType>('QA');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* ── Card type switcher ── */}
        <View style={styles.tabs}>
          {(['QA', 'STORY'] as CardType[]).map(t => (
            <Pressable key={t} style={[styles.tab, type === t && styles.tabActive]} onPress={() => setType(t)}>
              <Typography preset="label" color={type === t ? colors.primary : colors.textSecondary}>
                {t === 'QA' ? 'Q&A Card' : 'Story Card'}
              </Typography>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <CardForm key={type} setId={setId} type={type} onSaved={() => navigation.goBack()} />
          <Spacer size={spacing[8]} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing[3], alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.transparent },
  tabActive: { borderBottomColor: colors.primary },
  scroll: { padding: layout.screenPaddingH },
  formGap: { gap: spacing[4] },
  btnRow: { flexDirection: 'row', gap: spacing[3] },
  noteLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] },
  addNoteBtn: { borderWidth: 1.5, borderRadius: 12, borderColor: colors.border, borderStyle: 'dashed', paddingVertical: spacing[3], alignItems: 'center' },
  noteInput: { borderWidth: 1.5, borderRadius: 12, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, paddingHorizontal: spacing[4], paddingVertical: spacing[3], minHeight: 80, color: colors.textPrimary, textAlignVertical: 'top' },
  addNoteBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
