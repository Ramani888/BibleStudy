/** Placeholder texts for AI rows that aren't a real answer yet. */
export const TYPING = '__typing__';
export const FAILED = '__failed__';

export const isPlaceholder = (text: string) => text === TYPING || text === FAILED;

/** Rough pre-send hint: asking for cards costs 2 (the server decides for real). */
export const wantsCards = (text: string) => /flash\s?cards?|\bcards?\b/i.test(text);
