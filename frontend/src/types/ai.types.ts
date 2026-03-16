export interface DailyVerse {
  verse: string;
  reference: string;
  reflection?: string;
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
  answer: string;
  creditsUsed: number;
  remainingCredits: number;
}
