export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CardType = 'QA' | 'STORY';

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
  difficulty: Difficulty;
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
  difficulty?: Difficulty;
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
  difficulty?: Difficulty;
}

export interface MoveCardPayload {
  targetSetId: string;
}

export interface ReorderCardsPayload {
  setId: string;
  cardIds: string[];
}
