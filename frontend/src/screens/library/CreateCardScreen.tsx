import React, { useRef, useState } from 'react';
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
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { CardPreview } from './components/CardPreview';
import { FormField } from '../../components/forms';
import { Button, Divider, Spacer, Typography } from '../../components/ui';

import { useCreateCard, useBulkCreateCards } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

const ICON_SIZE = 20;

const MAX_BULK_CARDS = 100;

// ─── Single card schema ───────────────────────────────────────────────────────
const singleSchema = z.object({
  question: z.string().trim().min(1, 'Question is required').max(5000, 'Max 5000 characters'),
  answer: z.string().trim().min(1, 'Answer is required').max(5000, 'Max 5000 characters'),
});
type SingleForm = z.infer<typeof singleSchema>;

// ─── Bulk schema ──────────────────────────────────────────────────────────────
const bulkSchema = z.object({
  pairs: z.array(
    z.object({
      question: z.string().trim().min(1, 'Required').max(5000, 'Max 5000 characters'),
      answer: z.string().trim().min(1, 'Required').max(5000, 'Max 5000 characters'),
      note: z.string().max(2000, 'Max 2000 characters').optional(),
    }),
  ).min(1).max(MAX_BULK_CARDS, `Cannot exceed ${MAX_BULK_CARDS} cards`),
});
type BulkForm = z.infer<typeof bulkSchema>;

type Tab = 'single' | 'bulk';

// ─── Single card form ─────────────────────────────────────────────────────────
function SingleCardForm({ setId, onSaved }: { setId: string; onSaved: () => void }) {
  const answerRef = useRef<TextInput>(null);
  const { mutateAsync: createCard } = useCreateCard();
  const [note, setNote] = useState('');
  const [noteExpanded, setNoteExpanded] = useState(false);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: { question: '', answer: '' },
  });

  const questionValue = useWatch({ control, name: 'question' });
  const answerValue   = useWatch({ control, name: 'answer' });

  const onSubmit = async (data: SingleForm) => {
    try {
      await createCard({ setId, ...data, note: note.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Card added!', text2: 'Add another or go back' });
      setNote('');
      setNoteExpanded(false);
      reset();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  const onSubmitAndExit = async (data: SingleForm) => {
    try {
      await createCard({ setId, ...data, note: note.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Card added!' });
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  return (
    <View style={styles.formGap}>
      {/* ── Live preview ── */}
      <CardPreview question={questionValue || ''} answer={answerValue || ''} />

      <FormField
        name="question"
        control={control}
        label="Question"
        placeholder="Enter the question…"
        autoCapitalize="sentences"
        returnKeyType="next"
        maxLength={5000}
        onSubmitEditing={() => answerRef.current?.focus()}
      />
      <FormField
        name="answer"
        control={control}
        label="Answer"
        placeholder="Enter the answer…"
        autoCapitalize="sentences"
        inputRef={answerRef}
        returnKeyType="done"
        maxLength={5000}
        onSubmitEditing={handleSubmit(onSubmit)}
      />
      {noteExpanded ? (
        <View>
          <View style={styles.noteLabelRow}>
            <Typography preset="label" color={colors.textSecondary}>
              Note (optional)
            </Typography>
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
        <Button
          label="Add & Continue"
          variant="secondary"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          style={styles.flex}
        />
        <Button
          label="Done"
          onPress={handleSubmit(onSubmitAndExit)}
          loading={isSubmitting}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

// ─── Bulk card form ───────────────────────────────────────────────────────────
function BulkCardForm({ setId, onSaved }: { setId: string; onSaved: () => void }) {
  const { mutateAsync: bulkCreate } = useBulkCreateCards();
  const questionRefs = useRef<(TextInput | null)[]>([]);
  const answerRefs   = useRef<(TextInput | null)[]>([]);
  const [noteExpanded, setNoteExpanded] = useState<boolean[]>([false, false]);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      pairs: [
        { question: '', answer: '', note: '' },
        { question: '', answer: '', note: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'pairs' });

  const onSubmit = async (data: BulkForm) => {
    try {
      await bulkCreate({ setId, cards: data.pairs.map(p => ({ ...p, note: p.note?.trim() || undefined })) });
      Toast.show({ type: 'success', text1: `${data.pairs.length} cards added!` });
      onSaved();
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    }
  };

  const handleAppend = () => {
    append({ question: '', answer: '', note: '' });
    setNoteExpanded(prev => [...prev, false]);
  };

  const handleRemove = (i: number) => {
    remove(i);
    setNoteExpanded(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <View style={styles.formGap}>
      {fields.map((field, i) => (
        <View key={field.id} style={styles.bulkPair}>
          <View style={styles.bulkPairHeader}>
            <Typography preset="label" color={colors.textSecondary}>Card {i + 1}</Typography>
            {fields.length > 1 && (
              <Pressable onPress={() => handleRemove(i)}>
                <Typography preset="label" color={colors.error}>Remove</Typography>
              </Pressable>
            )}
          </View>
          <FormField
            name={`pairs.${i}.question`}
            control={control}
            placeholder="Question"
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={5000}
            inputRef={ref => { questionRefs.current[i] = ref; }}
            onSubmitEditing={() => answerRefs.current[i]?.focus()}
          />
          <FormField
            name={`pairs.${i}.answer`}
            control={control}
            placeholder="Answer"
            autoCapitalize="sentences"
            returnKeyType={i < fields.length - 1 ? 'next' : 'done'}
            maxLength={5000}
            inputRef={ref => { answerRefs.current[i] = ref; }}
            onSubmitEditing={() => {
              if (i < fields.length - 1) {
                questionRefs.current[i + 1]?.focus();
              }
            }}
          />
          {noteExpanded[i] ? (
            <Controller
              control={control}
              name={`pairs.${i}.note`}
              render={({ field: { value, onChange } }) => (
                <View>
                  <View style={styles.noteLabelRow}>
                    <Typography preset="label" color={colors.textSecondary}>Note (optional)</Typography>
                    <Pressable
                      onPress={() => {
                        onChange('');
                        setNoteExpanded(prev => { const n = [...prev]; n[i] = false; return n; });
                      }}
                      hitSlop={8}
                    >
                      <Typography preset="caption" color={colors.textSecondary}>Remove</Typography>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Add a hint or note…"
                    value={value ?? ''}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={2}
                    maxLength={2000}
                    placeholderTextColor={colors.textDisabled}
                    autoCapitalize="sentences"
                  />
                </View>
              )}
            />
          ) : (
            <Pressable
              style={styles.addNoteBtn}
              onPress={() => setNoteExpanded(prev => { const n = [...prev]; n[i] = true; return n; })}
            >
              <View style={styles.addNoteBtnContent}>
                <Icon name="add-circle-outline" size={ICON_SIZE} color={colors.textSecondary} />
                <Typography preset="label" color={colors.textSecondary}>Add Note</Typography>
              </View>
            </Pressable>
          )}
          {i < fields.length - 1 && <Divider />}
        </View>
      ))}

      <Button
        label="Add Another Card"
        variant="outline"
        onPress={handleAppend}
        disabled={fields.length >= MAX_BULK_CARDS || isSubmitting}
        fullWidth
      />

      <Button
        label={`Save ${fields.length} Cards`}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function CreateCardScreen({ navigation, route }: LibraryScreenProps<'CreateCard'>) {
  const { setId } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('single');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Tab switcher ── */}
        <View style={styles.tabs}>
          {(['single', 'bulk'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Typography
                preset="label"
                color={activeTab === tab ? colors.primary : colors.textSecondary}
              >
                {tab === 'single' ? 'Single Card' : 'Bulk Add'}
              </Typography>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'single' ? (
            <SingleCardForm setId={setId} onSaved={() => navigation.goBack()} />
          ) : (
            <BulkCardForm setId={setId} onSaved={() => navigation.goBack()} />
          )}
          <Spacer size={spacing[8]} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  scroll: { padding: layout.screenPaddingH },
  formGap: { gap: spacing[4] },
  btnRow: { flexDirection: 'row', gap: spacing[3] },
  noteLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  addNoteBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  noteInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 80,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  addNoteBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  bulkPair: { gap: spacing[3] },
  bulkPairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
