/**
 * Centralized React Query cache keys factory.
 * Guarantees type safety and consistent cache invalidation across the app.
 */
export const queryKeys = {
  achievements: {
    all: ['achievements'] as const,
    summary: ['achievements', 'summary'] as const,
  },
  activities: {
    all: ['activities'] as const,
    friends: ['activities', 'friends'] as const,
  },
  ai: {
    all: ['ai'] as const,
    history: ['ai-history'] as const,
    bookmarks: ['ai-bookmarks'] as const,
    conversation: (id: string) => ['ai-history', id] as const,
  },
  cards: {
    all: ['cards'] as const,
    bySet: (setId: string) => ['cards', setId] as const,
    dueSummary: ['cards', 'due-summary'] as const,
    detail: (id: string) => ['card', id] as const,
  },
  credits: {
    all: ['credits'] as const,
    balance: ['credits', 'balance'] as const,
    transactions: ['credits', 'transactions'] as const,
    streak: ['credits', 'streak'] as const,
  },
  folders: {
    all: ['folders'] as const,
    detail: (id: string) => ['folders', id] as const,
  },
  friends: {
    all: ['friends'] as const,
    leaderboard: ['friends', 'leaderboard'] as const,
    requests: (type?: string) => ['friends', 'requests', ...(type ? [type] : [])] as const,
    blocked: ['friends', 'blocked'] as const,
  },
  media: {
    all: ['media'] as const,
    detail: (id: string) => ['media', id] as const,
    storage: ['media', 'storage'] as const,
  },
  notes: {
    all: ['notes'] as const,
    detail: (id: string) => ['notes', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    settings: ['notification-settings'] as const,
  },
  plans: {
    all: ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
  },
  quiz: {
    all: ['quiz'] as const,
    recentAttempts: (limit?: number) => ['quiz', 'attempts', 'recent', ...(limit !== undefined ? [limit] : [])] as const,
    best: ['quiz', 'best'] as const,
    bestBySet: (setId?: string) => ['quiz', 'best', ...(setId ? [setId] : [])] as const,
    attemptResponses: (attemptId: string) => ['quiz', 'attempt', attemptId, 'responses'] as const,
  },
  sets: {
    all: ['sets'] as const,
    detail: (id: string) => ['sets', id] as const,
    stats: ['sets', 'stats'] as const,
    explore: ['sets', 'explore'] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', id] as const,
    search: (query?: string) => ['users', 'search', ...(query ? [query] : [])] as const,
  },
} as const;
