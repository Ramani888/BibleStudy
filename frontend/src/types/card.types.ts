export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Card {
  id: string;
  setId: string;
  userId: string | null;
  question: string;
  answer: string;
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
  question: string;
  answer: string;
  imageId?: string;
  isBlurred?: boolean;
  difficulty?: Difficulty;
}

export interface BulkCreateCardPayload {
  setId: string;
  cards: Array<{ question: string; answer: string }>;
}

export interface UpdateCardPayload {
  question?: string;
  answer?: string;
  imageId?: string | null;
  isBlurred?: boolean;
  difficulty?: Difficulty;
}

export interface ReorderCardsPayload {
  setId: string;
  cardIds: string[];
}

export interface StudyResultPayload {
  difficulty: Difficulty;
}
