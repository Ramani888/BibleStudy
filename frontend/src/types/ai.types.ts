export interface DailyVerse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatPayload {
  question: string;
  history?: ChatMessage[];
  sessionId?: string;
}

export interface AIChat {
  id: string;
  sessionId: string | null;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
}

export interface ChatSession {
  sessionId: string | null;
  title: string;
  customTitle?: string | null;
  tags: string[];
  messageCount: number;
  totalCreditsUsed: number;
  startedAt: string;
  messages: AIChat[];
}

export interface BookmarkedChat {
  id: string;
  sessionId: string | null;
  question: string;
  answer: string;
  creditsUsed: number;
  createdAt: string;
  bookmarkedAt: string;
}

export interface SuggestedCard {
  question: string;
  answer: string;
}

export interface AIChatResponse {
  id: string;
  question: string;
  answer: string;
  followUps?: string[];
  suggestedCards?: SuggestedCard[];
  creditsUsed: number;
  createdAt: string;
}
