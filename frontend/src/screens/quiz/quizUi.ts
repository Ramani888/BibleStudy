import type { TFunction } from 'i18next';
import type { QMColors } from '../../theme';
import type { SummaryItem } from '../../types';
import type { GeneratedQuizCard, QuizStackParamList } from '../../navigation/types';

type QuizParams = QuizStackParamList['Quiz'];

/** AI quizzes tag every response with a synthetic `gen-N` card id (real quizzes use
 *  UUIDs). Used to decide retake behaviour — see reQuizParams. */
const isGeneratedResponses = (responses?: SummaryItem[]): boolean =>
  !!responses?.some(r => r.cardId?.startsWith('gen-'));

/**
 * Source an AI re-quiz regenerates from (charged), or null when the retake is a free
 * replay: the topic wins, else the grounding sets of a generated quiz.
 */
export function reQuizSource(
  a: { setIds: string[]; topic?: string },
  responses?: SummaryItem[],
): { topic?: string; setIds?: string[] } | null {
  if (!isGeneratedResponses(responses)) return null;
  return a.topic ? { topic: a.topic } : a.setIds.length > 0 ? { setIds: a.setIds } : null;
}

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

/** Quiet-morning score tile [bg, ink]: ≥80 leaf, ≥50 gold, else warm; unscored = field. */
export function qmScoreTone(pct: number | null, qm: QMColors): [string, string] {
  if (pct === null) return [qm.field, qm.muted];
  return pct >= 80 ? [qm.leafBg, qm.leafText] : pct >= 50 ? [qm.goldBg, qm.goldText] : [qm.errorBg, qm.warm];
}

/** Sentence-case mode label (canvas copy): `modes.*`, with `modeNames.mix` for Mix. */
export function qmModeName(mode: string | null | undefined, t: TFunction): string {
  const m = mode ?? 'mix';
  return m === 'mix' ? t('quiz:modeNames.mix', 'Mix') : t(`quiz:modes.${m}`, MODE_NAMES[m] ?? m);
}
