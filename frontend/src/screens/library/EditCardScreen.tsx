import React, { useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import Icon from 'react-native-vector-icons/Ionicons';
import { ConfirmDialog, ErrorState } from '../../components/feedback';
import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';

const ICON_SIZE = 20;
import { useCards, useConfirmDialog, useDeleteCard, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, shadows, spacing } from '../../theme';
import type { Difficulty } from '../../types';
import type { LibraryScreenProps } from '../../navigation/types';

const schema = z.object({
  question: z.string().min(1, 'Question is required').trim(),
  answer: z.string().min(1, 'Answer is required').trim(),
});
type EditCardForm = z.infer<typeof schema>;

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const DIFF_COLOR: Record<Difficulty, string> = {
  EASY: colors.success,
  MEDIUM: colors.warning,
  HARD: colors.error,
};
const DIFF_BG: Record<Difficulty, string> = {
  EASY: colors.successSurface,
  MEDIUM: colors.warningSurface,
  HARD: colors.errorSurface,
};

export function EditCardScreen({ navigation, route }: LibraryScreenProps<'EditCard'>) {
  const { cardId, setId } = route.params;
  const { data: cards, isLoading, isError, error, refetch } = useCards(setId);
  const { mutateAsync: updateCard } = useUpdateCard(setId);
  const { mutateAsync: deleteCardAsync } = useDeleteCard(setId);
  const { show, dialogProps } = useConfirmDialog();

  const handleDelete = () => {
    show({
      title: 'Delete Card',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCardAsync(cardId);
          Toast.show({ type: 'success', text1: 'Card deleted' });
          navigation.goBack();
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };
  const answerRef = useRef<any>(null);
  const [difficulty, setDifficulty] = React.useState<Difficulty>('MEDIUM');
  const [note, setNote] = React.useState('');
  const [isBlurred, setIsBlurred] = React.useState(false);

  const card = cards?.find(c => c.id === cardId);

  React.useEffect(() => {
    if (card) {
      setDifficulty(card.difficulty);
      setNote(card.note ?? '');
      setIsBlurred(card.isBlurred);
    }
  }, [card]);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<EditCardForm>({
    resolver: zodResolver(schema),
    values: card ? { question: card.question, answer: card.answer } : undefined,
  });

  const questionValue = useWatch({ control, name: 'question' });
  const answerValue   = useWatch({ control, name: 'answer' });

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  if (!card) return <ErrorState message="Card not found" />;

  const onSubmit = async (data: EditCardForm) => {
    try {
      await updateCard({ id: cardId, payload: { ...data, difficulty, note: note.trim() || null, isBlurred } });
      Toast.show({ type: 'success', text1: 'Card updated!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Live preview ── */}
          <View style={styles.preview}>
            <View style={styles.previewTop}>
              <Typography
                preset="body"
                color={questionValue ? colors.textPrimary : colors.textDisabled}
                style={styles.previewText}
              >
                {questionValue || 'Front (question)'}
              </Typography>
            </View>
            <View style={styles.previewBottom}>
              <Typography
                preset="body"
                color={answerValue ? colors.textSecondary : colors.textDisabled}
                style={styles.previewText}
              >
                {answerValue || 'Back (answer)'}
              </Typography>
            </View>
          </View>

          <FormField
            name="question"
            control={control}
            label="Question"
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => answerRef.current?.focus()}
          />
          <FormField
            name="answer"
            control={control}
            label="Answer"
            autoCapitalize="sentences"
            inputRef={answerRef}
            returnKeyType="done"
          />

          {/* Difficulty picker */}
          <View>
            <Typography preset="label" color={colors.textSecondary} style={styles.label}>
              Difficulty
            </Typography>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map(d => (
                <Pressable
                  key={d}
                  style={[
                    styles.diffChip,
                    { borderColor: DIFF_COLOR[d] },
                    difficulty === d && { backgroundColor: DIFF_BG[d] },
                  ]}
                  onPress={() => setDifficulty(d)}
                >
                  <Typography
                    preset="label"
                    color={difficulty === d ? DIFF_COLOR[d] : colors.textSecondary}
                  >
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </Typography>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Note */}
          <View>
            <Typography preset="label" color={colors.textSecondary} style={styles.label}>
              Note (optional)
            </Typography>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a hint or note…"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="sentences"
            />
          </View>

          {/* Blur toggle */}
          <View>
            <Typography preset="label" color={colors.textSecondary} style={styles.label}>
              Blur answer in study mode
            </Typography>
            <Pressable
              style={[styles.blurChip, isBlurred && styles.blurChipActive]}
              onPress={() => setIsBlurred(b => !b)}
            >
              <View style={styles.blurChipRow}>
                <Icon
                  name={isBlurred ? 'eye-off-outline' : 'eye-outline'}
                  size={ICON_SIZE}
                  color={isBlurred ? colors.primary : colors.textSecondary}
                />
                <Typography preset="label" color={isBlurred ? colors.primary : colors.textSecondary}>
                  {isBlurred ? 'Answer blurred' : 'Answer visible'}
                </Typography>
              </View>
            </Pressable>
          </View>

          <Button
            label="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
          <View style={styles.deleteSection}>
            <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteRow}>
              <Icon name="trash-outline" size={ICON_SIZE} color={colors.error} />
              <Typography preset="label" color={colors.error}>Delete Card</Typography>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, gap: spacing[4] },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  label: { marginBottom: spacing[1.5] },
  diffRow: { flexDirection: 'row', gap: spacing[2] },
  diffChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
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
  blurChip: {
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
  },
  blurChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  preview: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  previewTop: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing[4],
    minHeight: 72,
    justifyContent: 'center',
  },
  previewBottom: {
    backgroundColor: colors.background,
    padding: spacing[4],
    minHeight: 56,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewText: { lineHeight: 22 },
  deleteSection: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  blurChipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
