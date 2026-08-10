import { create } from 'zustand';
import type { ChatSession, SuggestedCard } from '../types';

// One chat message as rendered in the AI chat screen. Persisted in this store
// (not component state) so the active conversation survives navigation — the
// chat you see is always what's here, until you clear it or load one from history.
export interface ChatUIMessage {
  id: string;
  chatId?: string;          // AIChat.id from DB (AI messages only)
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  creditsUsed?: number;
  followUps?: string[];
  suggestedCards?: SuggestedCard[];
  isHistorical?: boolean;   // loaded from Chat History (banner suppressed)
  userQuestion?: string;    // question that prompted this AI response (for Save as Card)
  attachmentName?: string;     // name of an attached file (user messages only)
  attachmentType?: 'IMAGE' | 'PDF';
  attachmentLocalUri?: string; // local/S3 URI for image thumbnail
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface AIChatState {
  messages: ChatUIMessage[];
  sessionId: string;
  tags: string[];
  savedMessageIds: Set<string>;

  setMessages: (updater: ChatUIMessage[] | ((prev: ChatUIMessage[]) => ChatUIMessage[])) => void;
  setTags: (tags: string[]) => void;
  markSaved: (messageId: string) => void;
  unmarkSaved: (messageId: string) => void;
  loadSession: (session: ChatSession) => void;
  clear: () => void;
}

export const useAIChatStore = create<AIChatState>(set => ({
  messages: [],
  sessionId: generateUUID(),
  tags: [],
  savedMessageIds: new Set(),

  setMessages: updater =>
    set(state => ({
      messages: typeof updater === 'function' ? updater(state.messages) : updater,
    })),

  setTags: tags => set({ tags }),

  markSaved: messageId =>
    set(state => ({ savedMessageIds: new Set(state.savedMessageIds).add(messageId) })),

  unmarkSaved: messageId =>
    set(state => {
      const next = new Set(state.savedMessageIds);
      next.delete(messageId);
      return { savedMessageIds: next };
    }),

  loadSession: session =>
    set({
      // Each AIChat record is one Q&A pair — expand into two messages.
      messages: session.messages.flatMap(chat => [
        {
          id: `${chat.id}_user`,
          role: 'user' as const,
          text: chat.question,
          timestamp: new Date(chat.createdAt).getTime(),
          creditsUsed: 1,
        },
        {
          id: `${chat.id}_ai`,
          chatId: chat.id,
          role: 'ai' as const,
          text: chat.answer,
          timestamp: new Date(chat.createdAt).getTime(),
          suggestedCards: chat.suggestedCards ?? undefined,
          followUps: chat.followUps ?? undefined,
          isHistorical: true,
          userQuestion: chat.question,
        },
      ]),
      sessionId: session.sessionId ?? generateUUID(),
      tags: session.tags ?? [],
      savedMessageIds: new Set(
        session.messages.filter(c => c.cardsSaved).map(c => `${c.id}_ai`),
      ),
    }),

  clear: () => set({ messages: [], sessionId: generateUUID(), tags: [], savedMessageIds: new Set() }),
}));
