export interface DailyVerse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface AIChatPayload {
  question: string;
}

export interface AIChat {
  id: string;
  userId: string;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
}

export interface AIChatResponse {
  id: string;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
}
