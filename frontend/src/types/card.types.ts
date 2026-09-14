export type CardType = 'QA' | 'STORY';
export type CardDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Card {
  id: string;
  setId: string;
  userId: string | null;
  type: CardType;
  question: string;
  answer: string;
  note: string | null;
  imageId: string | null;
  order: number;
  isBlurred: boolean;
  difficulty: CardDifficulty;
  lastStudiedAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardPayload {
  setId: string;
  type?: CardType;
  question?: string;
  answer: string;
  note?: string;
  imageId?: string;
  isBlurred?: boolean;
}

export interface BulkCreateCardPayload {
  setId: string;
  cards: Array<{ question: string; answer: string; note?: string }>;
}

export interface UpdateCardPayload {
  type?: CardType;
  question?: string;
  answer?: string;
  note?: string | null;
  imageId?: string | null;
  isBlurred?: boolean;
}

export interface MoveCardPayload {
  targetSetId: string;
}

/** Spaced-repetition summary for the Home "TODAY" card. */
export interface DueSummary {
  dueCount: number;
  dueSets: number;
  topSet: { id: string; title: string } | null;
}

/** Per-set mastery — share of cards whose SM-2 interval has reached maturity. */
export interface SetMastery {
  setId: string;
  total: number;
  learned: number;
  masteryPct: number;
}

export interface ReorderCardsPayload {
  setId: string;
  cardIds: string[];
}
