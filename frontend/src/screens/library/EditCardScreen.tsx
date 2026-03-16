import React, { useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';

import { FormField } from '../../components/forms';
import { Button, Typography } from '../../components/ui';
import { useCards, useUpdateCard } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';
import type { Difficulty } from '../../types';
import type { LibraryScreenProps } from '../../navigation/types';
import { Pressable } from 'react-native';

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
  const { data: cards, isLoading } = useCards(setId);
  const { mutateAsync: updateCard } = useUpdateCard(setId);
  const answerRef = useRef<any>(null);
  const [difficulty, setDifficulty] = React.useState<Difficulty>('MEDIUM');

  const card = cards?.find(c => c.id === cardId);

  React.useEffect(() => {
    if (card) setDifficulty(card.difficulty);
  }, [card]);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<EditCardForm>({
    resolver: zodResolver(schema),
    values: card ? { question: card.question, answer: card.answer } : undefined,
  });

  if (isLoading || !card) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const onSubmit = async (data: EditCardForm) => {
    try {
      await updateCard({ id: cardId, payload: { ...data, difficulty } });
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

          <Button
            label="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
});
