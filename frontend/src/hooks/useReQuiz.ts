import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '../api';
import { reQuizParams } from '../screens/quiz/quizUi';
import type { SummaryItem } from '../types';
import { useConfirmDialog } from './useConfirmDialog';
import { useCreditBalance } from './useCredits';
import { useGenerateQuiz } from './useQuiz';

const AI_QUIZ_COST = 2;

type ReQuizAttempt = {
  id: string;
  setIds: string[];
  setTitles: string[];
  mode: string | null;
  quizName?: string;
  topic?: string;
};

/**
 * Re-quiz an existing attempt. For an AI quiz that still knows its source (a topic
 * or grounding sets) this GENERATES fresh questions from that source — confirming
 * first, then charging {@link AI_QUIZ_COST} credits — and updates the same attempt.
 * Quizzes with no stored source (older data) and real card-based quizzes fall back
 * to replay/fetch via reQuizParams, free of charge.
 *
 * Returns `dialogProps` (render a <ConfirmDialog/>) and `isGenerating` (render the
 * generation overlay) so the calling screen wires the UI.
 */
export function useReQuiz() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation(['quiz', 'common']);
  const generate = useGenerateQuiz();
  const { data: creditBalance } = useCreditBalance();
  const { show, dialogProps } = useConfirmDialog();

  const goPaywall = useCallback(() => {
    Toast.show({ type: 'error', text1: t('quiz:setup.outOfCredits', 'Out of credits'), text2: t('quiz:setup.upgradeToGenerate', 'Upgrade to generate AI quizzes.') });
    navigation.navigate('ProfileTab', { screen: 'Paywall' });
  }, [navigation, t]);

  const regenerate = useCallback((attempt: ReQuizAttempt, source: { topic?: string; setIds?: string[] }) => {
    generate.mutate(source, {
      onSuccess: ({ cards: generatedCards }) => {
        navigation.navigate('Quiz', {
          setIds: attempt.setIds,
          setTitles: attempt.setTitles.length ? attempt.setTitles : [attempt.quizName ?? ''],
          mode: 'mc',
          quizName: attempt.quizName,
          topic: attempt.topic,
          retakeAttemptId: attempt.id,
          generatedCards,
        });
      },
      onError: (err) => {
        if ((err as { response?: { status?: number } })?.response?.status === 402) { goPaywall(); return; }
        Toast.show({ type: 'error', text1: t('quiz:setup.couldNotGenerate', "Couldn't generate quiz"), text2: getErrorMessage(err) });
      },
    });
  }, [generate, navigation, t, goPaywall]);

  const reQuiz = useCallback((attempt: ReQuizAttempt, responses?: SummaryItem[]) => {
    if (generate.isPending) return;
    const isGenerated = !!responses?.some(r => r.cardId?.startsWith('gen-'));
    // Source to regenerate from: the topic wins, else the grounding sets.
    const source: { topic?: string; setIds?: string[] } | null =
      attempt.topic ? { topic: attempt.topic }
      : isGenerated && attempt.setIds.length > 0 ? { setIds: attempt.setIds }
      : null;

    // AI quiz with a known source → confirm + regenerate fresh questions (charged).
    if (isGenerated && source) {
      if (creditBalance && creditBalance.balance < AI_QUIZ_COST) { goPaywall(); return; }
      show({
        title: t('quiz:reQuiz.confirmTitle', 'New questions?'),
        message: t('quiz:reQuiz.confirmMessage', { cost: AI_QUIZ_COST, defaultValue: `Re-quiz makes new questions from the same source and uses ${AI_QUIZ_COST} credits.` }),
        confirmLabel: t('quiz:reQuiz.confirmCta', { cost: AI_QUIZ_COST, defaultValue: `Use ${AI_QUIZ_COST} credits` }),
        onConfirm: () => regenerate(attempt, source),
      });
      return;
    }

    // No stored source (old data) or a real card-based quiz → replay/fetch, free.
    navigation.navigate('Quiz', reQuizParams(attempt, responses));
  }, [generate.isPending, creditBalance, show, t, regenerate, goPaywall, navigation]);

  return { reQuiz, dialogProps, isGenerating: generate.isPending };
}
