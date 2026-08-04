import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Button, Spacer, Typography } from '../../../components/ui';
import { colors, layout, spacing } from '../../../theme';
import type { QuizQuestion } from '../../../types';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

type OptionState = 'idle' | 'correct' | 'wrong' | 'faded';

interface Props {
  question: QuizQuestion;
  selectedIndex: number | null;
  isLast: boolean;
  onPick: (index: number) => void;
  onNext: () => void;
}

export function QuizQuestionView({ question, selectedIndex, isLast, onPick, onNext }: Props) {
  const answered = selectedIndex !== null;
  const isCorrect = answered && selectedIndex === question.answerIndex;

  const stateOf = (i: number): OptionState => {
    if (!answered) return 'idle';
    if (i === question.answerIndex) return 'correct';
    if (i === selectedIndex) return 'wrong';
    return 'faded';
  };

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography preset="label" color={colors.textSecondary}>QUESTION</Typography>
        <Spacer size={spacing[2]} />
        <Typography preset="h3" color={colors.textPrimary}>{question.prompt}</Typography>
        <Spacer size={spacing[5]} />

        {question.options.map((option, i) => {
          const state = stateOf(i);
          return (
            <Pressable
              key={i}
              disabled={answered}
              onPress={() => onPick(i)}
              style={[styles.option, OPTION_STYLE[state]]}
              accessibilityRole="button"
            >
              <View style={[styles.letter, LETTER_STYLE[state]]}>
                <Typography preset="label" color={LETTER_TEXT[state]}>{OPTION_LETTERS[i]}</Typography>
              </View>
              <Typography
                preset="body"
                color={state === 'faded' ? colors.textDisabled : colors.textPrimary}
                style={styles.optionText}
              >
                {option}
              </Typography>
              {state === 'correct' && <Icon name="checkmark-circle" size={22} color={colors.success} />}
              {state === 'wrong' && <Icon name="close-circle" size={22} color={colors.error} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {answered && (
        <View style={styles.footer}>
          <View style={[styles.banner, isCorrect ? styles.bannerCorrect : styles.bannerWrong]}>
            <Icon
              name={isCorrect ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isCorrect ? colors.success : colors.error}
            />
            <Typography preset="label" color={isCorrect ? colors.success : colors.error}>
              {isCorrect ? 'Correct!' : `Answer: ${question.options[question.answerIndex]}`}
            </Typography>
          </View>
          <Spacer size={spacing[3]} />
          <Button label={isLast ? 'See Results' : 'Next Question'} onPress={onNext} fullWidth />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { padding: layout.screenPaddingH, paddingBottom: spacing[4] },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: spacing[3],
  },
  letter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: 12,
  },
  bannerCorrect: { backgroundColor: colors.successSurface },
  bannerWrong: { backgroundColor: colors.errorSurface },
});

const OPTION_STYLE: Record<OptionState, object> = {
  idle:    { borderColor: colors.border, backgroundColor: colors.background },
  correct: { borderColor: colors.success, backgroundColor: colors.successSurface },
  wrong:   { borderColor: colors.error, backgroundColor: colors.errorSurface },
  faded:   { borderColor: colors.border, backgroundColor: colors.background, opacity: 0.6 },
};

const LETTER_STYLE: Record<OptionState, object> = {
  idle:    { backgroundColor: colors.backgroundSecondary },
  correct: { backgroundColor: colors.success },
  wrong:   { backgroundColor: colors.error },
  faded:   { backgroundColor: colors.backgroundSecondary },
};

const LETTER_TEXT: Record<OptionState, string> = {
  idle:    colors.textSecondary,
  correct: colors.background,
  wrong:   colors.background,
  faded:   colors.textDisabled,
};
