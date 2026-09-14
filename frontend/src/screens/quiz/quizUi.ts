import type { ThemeColors } from '../../theme';
import type { SummaryItem } from '../../types';
import type { GeneratedQuizCard, QuizStackParamList } from '../../navigation/types';

type QuizParams = QuizStackParamList['Quiz'];

/** AI quizzes tag every response with a synthetic `gen-N` card id (real quizzes use
 *  UUIDs). Used to decide retake behaviour — see reQuizParams. */
const isGeneratedResponses = (responses?: SummaryItem[]): boolean =>
  !!responses?.some(r => r.cardId?.startsWith('gen-'));

/**
 * Params to re-quiz an existing attempt. An AI quiz (topic OR set-grounded) has no
 * real cards to re-fetch, so we replay it by reconstructing throwaway Q&A cards from
 * the stored responses (prompt → question, correctAnswer → answer). Real set-backed
 * quizzes (review-due) just replay from their sets. Either way `retakeAttemptId`
 * makes the result UPDATE the same attempt (never ephemeral → always saved).
 */
export function reQuizParams(
  a: { id: string; setIds: string[]; setTitles: string[]; mode: string | null; quizName?: string },
  responses?: SummaryItem[],
): QuizParams {
  const common = { mode: (a.mode ?? 'mix') as QuizParams['mode'], retakeAttemptId: a.id, quizName: a.quizName };
  if (isGeneratedResponses(responses)) {
    const generatedCards: GeneratedQuizCard[] = responses!.map(r => ({ question: r.prompt, answer: r.correctAnswer }));
    return { ...common, setIds: a.setIds, setTitles: a.setTitles.length ? a.setTitles : [a.quizName ?? ''], generatedCards };
  }
  return { ...common, setIds: a.setIds, setTitles: a.setTitles };
}

/**
 * English fallbacks for the `quiz:modeNames.*` i18n keys. The locale JSON is the
 * source of truth; this map is only the default shown when a key is missing.
 * Shared by QuizHub, QuizDetail and QuizSummary so the labels never drift.
 */
export const MODE_NAMES: Record<string, string> = {
  mix: 'Mix',
  mc: 'Multiple Choice',
  story_mc: 'Story MC',
  type_answer: 'Type Answer',
  type_verbatim: 'Type Verbatim',
  blanks: 'Fill Blanks',
  chunks: 'Reorder',
  read: 'Read',
};

/** Score → semantic color: ≥80 success, ≥50 warning, else alert. */
export function scoreColor(pct: number, colors: ThemeColors): string {
  return pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.alert;
}
