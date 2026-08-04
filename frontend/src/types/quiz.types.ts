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
  setId: string;
  total: number;
  correct: number;
}

export interface RecordAttemptResult {
  attempt: QuizAttempt;
  best: number | null;
}

// Best score + attempt count for a set (Quiz hub badges).
export interface SetBestScore {
  setId: string;
  best: number;
  attempts: number;
}

// A client-side multiple-choice question, built from a Card by useQuizSession.
export interface QuizQuestion {
  cardId: string;
  prompt: string;       // the card's question
  options: string[];    // 4 answer strings (1 correct + 3 distractors), shuffled
  answerIndex: number;  // index of the correct option within `options`
}
