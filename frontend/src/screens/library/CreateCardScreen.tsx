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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { FormField } from '../../components/forms';
import { Button, Divider, Spacer, Typography } from '../../components/ui';
import { useCreateCard, useBulkCreateCards } from '../../hooks';
import { colors, layout, spacing } from '../../theme';
import type { LibraryScreenProps } from '../../navigation/types';

// ─── Single card schema ───────────────────────────────────────────────────────
const singleSchema = z.object({
  question: z.string().min(1, 'Question is required').trim(),
  answer: z.string().min(1, 'Answer is required').trim(),
});
type SingleForm = z.infer<typeof singleSchema>;

// ─── Bulk schema ──────────────────────────────────────────────────────────────
const bulkSchema = z.object({
  pairs: z.array(
    z.object({
      question: z.string().min(1, 'Required').trim(),
      answer: z.string().min(1, 'Required').trim(),
    }),
  ).min(1),
});
type BulkForm = z.infer<typeof bulkSchema>;

type Tab = 'single' | 'bulk';

// ─── Single card form ─────────────────────────────────────────────────────────
function SingleCardForm({ setId, onSaved }: { setId: string; onSaved: () => void }) {
  const answerRef = useRef<TextInput>(null);
  const { mutateAsync: createCard } = useCreateCard();

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: { question: '', answer: '' },
  });

  const onSubmit = async (data: SingleForm) => {
    await createCard({ setId, ...data });
    Toast.show({ type: 'success', text1: 'Card added!', text2: 'Add another or go back' });
    reset();
  };

  const onSubmitAndExit = async (data: SingleForm) => {
    await createCard({ setId, ...data });
    Toast.show({ type: 'success', text1: 'Card added!' });
    onSaved();
  };

  return (
    <View style={styles.formGap}>
      <FormField
        name="question"
        control={control}
        label="Question"
        placeholder="Enter the question…"
        autoCapitalize="sentences"
        returnKeyType="next"
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
        onSubmitEditing={handleSubmit(onSubmit)}
      />
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

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<BulkForm>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      pairs: [
        { question: '', answer: '' },
        { question: '', answer: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'pairs' });

  const onSubmit = async (data: BulkForm) => {
    await bulkCreate({ setId, cards: data.pairs });
    Toast.show({ type: 'success', text1: `${data.pairs.length} cards added!` });
    onSaved();
  };

  return (
    <View style={styles.formGap}>
      {fields.map((field, i) => (
        <View key={field.id} style={styles.bulkPair}>
          <View style={styles.bulkPairHeader}>
            <Typography preset="label" color={colors.textSecondary}>Card {i + 1}</Typography>
            {fields.length > 1 && (
              <Pressable onPress={() => remove(i)}>
                <Typography preset="label" color={colors.error}>Remove</Typography>
              </Pressable>
            )}
          </View>
          <FormField
            name={`pairs.${i}.question`}
            control={control}
            placeholder="Question"
            autoCapitalize="sentences"
          />
          <FormField
            name={`pairs.${i}.answer`}
            control={control}
            placeholder="Answer"
            autoCapitalize="sentences"
          />
          {i < fields.length - 1 && <Divider />}
        </View>
      ))}

      <Button
        label="+ Add Another Card"
        variant="outline"
        onPress={() => append({ question: '', answer: '' })}
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
  bulkPair: { gap: spacing[3] },
  bulkPairHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
