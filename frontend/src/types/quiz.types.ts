// A persisted quiz attempt (backend record).
export interface QuizAttempt {
  id: string;
  userId: string;
  setId: string;
  total: number;
  correct: number;
  scorePct: number;
  createdAt: string;
}

export interface RecordAttemptPayload {
  setIds: string[];
  total: number;
  correct: number;
  mode?: string;
  quizName?: string;
}

export interface RecordAttemptResult {
  attempt: QuizAttempt;
  best: number | null;
}

// A quiz attempt joined with its set title (for the history list).
export interface QuizAttemptWithSet {
  id: string;
  setId: string;
  setIds: string[];
  setTitle: string;
  setTitles: string[];
  mode: string | null;
  quizName?: string;
  practicedAt?: string;
  scorePct: number;
  total: number;
  correct: number;
  createdAt: string;
}

// Best score + attempt count for a set (Quiz hub badges).
export interface SetBestScore {
  setId: string;
  best: number;
  attempts: number;
}

// The quiz modes. `mix` is a meta-mode (rotate all supported modes).
export type QuizMode =
  | 'mc'            // Q&A: question -> pick answer
  | 'type_answer'   // Q&A: type the answer
  | 'blanks'        // Story: fill blanked words
  | 'type_verbatim' // Story: type the whole passage
  | 'story_mc'      // Story: reference -> pick text
  | 'chunks'        // Story: order the word-groups
  | 'read';         // Story: read to memorize (unscored)

export type QuizSelectableMode = QuizMode | 'mix';

// One built quiz item (a discriminated union by mode).
export type QuizItem =
  | { mode: 'mc' | 'story_mc'; cardId: string; prompt: string; options: string[]; answerIndex: number }
  | { mode: 'type_answer' | 'type_verbatim'; cardId: string; prompt: string; answer: string }
  | { mode: 'blanks'; cardId: string; prompt: string; tokens: string[]; blankAt: number[] }
  | { mode: 'chunks'; cardId: string; prompt: string; chunks: string[]; correct: string[] }
  | { mode: 'read'; cardId: string; prompt: string; text: string };

// Kept for the original MC view's prop shape.
export interface QuizQuestion {
  cardId: string;
  prompt: string;
  options: string[];
  answerIndex: number;
}
