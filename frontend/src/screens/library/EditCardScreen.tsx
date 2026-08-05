import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { EyeIcon, EyeOffIcon, TrashIcon } from '../../components/icons';
import { CardPreview } from './components/CardPreview';
import { ConfirmDialog, ErrorState } from '../../components/feedback';
import { FormField } from '../../components/forms';
import { Button, Screen, ScreenHeader, Typography } from '../../components/ui';

import { useCardById, useConfirmDialog, useDeleteCard, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { Theme, useTheme } from '../../theme';
import type { Difficulty } from '../../types';
import type { LibraryScreenProps } from '../../navigation/types';

const ICON_SIZE = 20;

// Question optional so Story cards (reference optional) edit cleanly; QA cards
// already carry a question.
const schema = z.object({
  question: z.string().trim().max(5000, 'Max 5000 characters'),
  answer: z.string().trim().min(1, 'Answer is required'),
});
type EditCardForm = z.infer<typeof schema>;

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

export function EditCardScreen({ navigation, route }: LibraryScreenProps<'EditCard'>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const { cardId, setId } = route.params;
  const { data: card, isLoading, isError, error, refetch } = useCardById(cardId);
  const { mutateAsync: updateCard } = useUpdateCard(setId);
  const { mutateAsync: deleteCardAsync } = useDeleteCard(setId);
  const { show, dialogProps } = useConfirmDialog();

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
  const answerRef = useRef<TextInput>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => card?.difficulty ?? 'MEDIUM');
  const [note, setNote] = useState(() => card?.note ?? '');
  const [isBlurred, setIsBlurred] = useState(() => card?.isBlurred ?? false);

  const initialized = useRef(false);
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<EditCardForm>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (card && !initialized.current) {
      initialized.current = true;
      setDifficulty(card.difficulty);
      setNote(card.note ?? '');
      setIsBlurred(card.isBlurred);
      reset({ question: card.question, answer: card.answer });
    }
  }, [card, reset]);

  const questionValue = useWatch({ control, name: 'question' });
  const answerValue   = useWatch({ control, name: 'answer' });

  const header = (
    <ScreenHeader
      title="Edit Card"
      handle
      right={
        <Pressable onPress={handleDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete card">
          <TrashIcon size={ICON_SIZE} color={colors.error} />
        </Pressable>
      }
    />
  );

  if (isLoading) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      </Screen>
    );
  }
  if (!card) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <ErrorState message="Card not found" onRetry={refetch} />
      </Screen>
    );
  }

  const onSubmit = async (data: EditCardForm) => {
    try {
      await updateCard({ id: cardId, payload: { ...data, difficulty, note: note.trim() || null, isBlurred } });
      Toast.show({ type: 'success', text1: 'Card updated!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: getErrorMessage(err) });
    }
  };

  const footer = (
    <View style={styles.footer}>
      <Button label="Save Changes" onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth />
    </View>
  );

  return (
    <Screen header={header} footer={footer} edges={['top', 'bottom']} keyboardAvoiding>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Live preview ── */}
        <CardPreview question={questionValue || ''} answer={answerValue || ''} />

          <FormField
            name="question"
            control={control}
            label={card.type === 'STORY' ? 'Reference (optional)' : 'Question'}
            autoCapitalize="sentences"
            returnKeyType="next"
            maxLength={5000}
            onSubmitEditing={() => answerRef.current?.focus()}
          />
          <FormField
            name="answer"
            control={control}
            label={card.type === 'STORY' ? 'Text' : 'Answer'}
            autoCapitalize="sentences"
            inputRef={answerRef}
            maxLength={5000}
            multiline
            minHeight={card.type === 'STORY' ? 120 : 80}
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
                    difficulty === d && { backgroundColor: DIFF_BG[d], borderWidth: 0 },
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
              {card.type === 'STORY' ? 'Note (optional)' : 'Hint (optional)'}
            </Typography>
            <TextInput
              style={styles.noteInput}
              placeholder={card.type === 'STORY' ? 'Add a note or reflection…' : 'Add a hint…'}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              maxLength={2000}
              placeholderTextColor={colors.textSecondary}
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
                {isBlurred ? (
                  <EyeOffIcon size={ICON_SIZE} color={colors.primary} />
                ) : (
                  <EyeIcon size={ICON_SIZE} color={colors.textSecondary} />
                )}
                <Typography preset="label" color={isBlurred ? colors.primary : colors.textSecondary}>
                  {isBlurred ? 'Answer blurred' : 'Answer visible'}
                </Typography>
              </View>
            </Pressable>
          </View>

        <View style={styles.deleteSection}>
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteRow}>
            <TrashIcon size={ICON_SIZE} color={colors.error} />
            <Typography preset="label" color={colors.error}>Delete Card</Typography>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scroll: { padding: layout.screenPaddingH, gap: spacing[4] },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: {
      padding: layout.screenPaddingH,
      paddingBottom: spacing[2],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
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
      borderRadius: layout.cardRadius,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      minHeight: 80,
      color: colors.textPrimary,
      textAlignVertical: 'top',
    },
    blurChip: {
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
    },
    blurChipActive: {
      backgroundColor: colors.primarySurface,
    },
    deleteSection: {
      alignItems: 'center',
      paddingVertical: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    blurChipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  });
