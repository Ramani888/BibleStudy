import { useCallback, useMemo, useState } from 'react';
import type { Card, QuizItem, QuizMode, QuizSelectableMode, SummaryItem } from '../types';

export const MIN_MC_CARDS = 4; // MC / Story-MC need 4 options
const OPTIONS = 4;
const BLANK_RATIO = 0.4;
const CHUNK_SIZE = 4;

export const MODE_META: Record<QuizMode, { label: string; scored: boolean }> = {
  mc:            { label: 'Multiple choice', scored: true },
  type_answer:   { label: 'Type the answer', scored: true },
  blanks:        { label: 'Fill in the blanks', scored: true },
  type_verbatim: { label: 'Type it out', scored: true },
  story_mc:      { label: 'Match the verse', scored: true },
  chunks:        { label: 'Order the chunks', scored: true },
  read:          { label: 'Read & memorize', scored: false },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
const core = (w: string) => w.replace(/[^A-Za-z0-9']/g, '');

/** Which modes a set's cards can produce (drives the mode picker). */
export function supportedModes(cards: Card[]): QuizMode[] {
  const qa = cards.filter(c => c.type === 'QA').length;
  const story = cards.filter(c => c.type === 'STORY').length;
  const modes: QuizMode[] = [];
  if (qa > 0) modes.push('type_answer');
  if (qa >= MIN_MC_CARDS) modes.push('mc');
  if (story > 0) modes.push('blanks', 'type_verbatim', 'chunks', 'read');
  if (story >= MIN_MC_CARDS) modes.push('story_mc');
  return modes;
}

function cardModes(card: Card, cards: Card[]): QuizMode[] {
  return supportedModes(cards).filter(m => {
    const q = card.type === 'QA';
    if (m === 'mc' || m === 'type_answer') return q;
    return !q; // all story modes
  });
}

// ─── item builders ──────────────────────────────────────────────────────────
function buildItem(card: Card, mode: QuizMode, cards: Card[]): QuizItem | null {
  const ref = card.question || 'this passage';
  switch (mode) {
    case 'mc':
    case 'story_mc': {
      const sameType = card.type;
      const pool = Array.from(new Set(
        cards.filter(c => c.type === sameType && c.id !== card.id && c.answer !== card.answer).map(c => c.answer),
      ));
      const distractors = shuffle(pool).slice(0, OPTIONS - 1);
      if (distractors.length < OPTIONS - 1) return null;
      const options = shuffle([card.answer, ...distractors]);
      return {
        mode,
        cardId: card.id,
        prompt: mode === 'mc' ? card.question : `Which passage is ${ref}?`,
        options,
        answerIndex: options.indexOf(card.answer),
      };
    }
    case 'type_answer':
      return { mode, cardId: card.id, prompt: card.question, answer: card.answer };
    case 'type_verbatim':
      return { mode, cardId: card.id, prompt: card.question ? `Type ${ref}` : 'Type the passage', answer: card.answer };
    case 'blanks': {
      const tokens = card.answer.split(/\s+/).filter(Boolean);
      const eligible = tokens.map((t, i) => ({ i, ok: core(t).length >= 3 })).filter(e => e.ok).map(e => e.i);
      const n = Math.max(1, Math.round(eligible.length * BLANK_RATIO));
      const blankAt = shuffle(eligible).slice(0, n).sort((a, b) => a - b);
      if (blankAt.length === 0) return null;
      return { mode, cardId: card.id, prompt: card.question, tokens, blankAt };
    }
    case 'chunks': {
      const words = card.answer.split(/\s+/).filter(Boolean);
      const correct: string[] = [];
      for (let i = 0; i < words.length; i += CHUNK_SIZE) correct.push(words.slice(i, i + CHUNK_SIZE).join(' '));
      if (correct.length < 2) return null;
      return { mode, cardId: card.id, prompt: card.question, chunks: shuffle(correct), correct };
    }
    case 'read':
      return { mode, cardId: card.id, prompt: card.question, text: card.answer };
  }
}

function buildItems(cards: Card[], selected: QuizSelectableMode): QuizItem[] {
  const items: QuizItem[] = [];
  for (const card of shuffle(cards)) {
    const modes = cardModes(card, cards);
    if (modes.length === 0) continue;

    // Priority order: preferred mode first, then all other supported modes as fallback.
    // This guarantees every card produces at least one question even if the
    // selected mode doesn't apply to its card type.
    let preferred: QuizMode;
    if (selected === 'mix') {
      const scored = modes.filter(m => MODE_META[m].scored);
      preferred = shuffle(scored.length ? scored : modes)[0];
    } else {
      preferred = modes.includes(selected as QuizMode)
        ? (selected as QuizMode)
        : (modes.filter(m => MODE_META[m].scored)[0] ?? modes[0]);
    }

    const orderedModes = [preferred, ...modes.filter(m => m !== preferred)];
    for (const m of orderedModes) {
      const item = buildItem(card, m, cards);
      if (item) { items.push(item); break; }
    }
  }
  return items;
}

// ─── grading ──────────────────────────────────────────────────────────────────
export function gradeItem(item: QuizItem, response: unknown): boolean {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return response === item.answerIndex;
    case 'type_answer':
    case 'type_verbatim':
      return normalize(String(response ?? '')) === normalize(item.answer);
    case 'blanks': {
      const r = (response as string[]) ?? [];
      return item.blankAt.every((tokenIdx, k) => normalize(r[k] ?? '') === normalize(core(item.tokens[tokenIdx])));
    }
    case 'chunks':
      return JSON.stringify(response) === JSON.stringify(item.correct);
    case 'read':
      return true; // unscored
  }
}

// ─── summary helpers ─────────────────────────────────────────────────────────
function formatUserAnswer(item: QuizItem, response: unknown): string {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return typeof response === 'number' ? (item.options[response] ?? '—') : '—';
    case 'type_answer':
    case 'type_verbatim':
      return String(response ?? '').trim() || '—';
    case 'blanks': {
      const r = (response as string[]) ?? [];
      return item.tokens.map((t, i) => {
        const blankIdx = item.blankAt.indexOf(i);
        return blankIdx >= 0 ? (r[blankIdx] || '___') : t;
      }).join(' ');
    }
    case 'chunks':
      // response stores "i::chunkText" keys — strip the prefix before display
      return Array.isArray(response)
        ? (response as string[]).map(k => k.slice(k.indexOf('::') + 2)).join(' → ')
        : '—';
    case 'read':
      return '(read)';
  }
}

function formatCorrectAnswer(item: QuizItem): string {
  switch (item.mode) {
    case 'mc':
    case 'story_mc':
      return item.options[item.answerIndex];
    case 'type_answer':
    case 'type_verbatim':
      return item.answer;
    case 'blanks':
      return item.tokens.join(' ');
    case 'chunks':
      return item.correct.join(' → ');
    case 'read':
      return item.text;
  }
}

export function buildSummaryItems(items: QuizItem[], responses: Record<number, unknown>): SummaryItem[] {
  return items.map((item, index) => {
    const response = responses[index];
    const isCorrect = MODE_META[item.mode].scored ? gradeItem(item, response) : true;
    return {
      index,
      cardId: item.cardId,
      mode: item.mode,
      prompt: item.prompt,
      isCorrect,
      userAnswer: formatUserAnswer(item, response),
      correctAnswer: formatCorrectAnswer(item),
    };
  });
}

// ─── hook ───────────────────────────────────────────────────────────────────
export function useQuizSession(cards: Card[], selected: QuizSelectableMode) {
  const [seed, setSeed] = useState(0);
  const items = useMemo(
    () => buildItems(cards, selected),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, selected, seed],
  );

  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const item = items[index];
  const total = items.length;
  const scoredTotal = items.filter(i => MODE_META[i.mode].scored).length;
  const progress = total > 0 ? (index + 1) / total : 0;
  const scorePct = scoredTotal > 0 ? Math.round((correctCount / scoredTotal) * 100) : 0;

  const submit = useCallback(
    (response: unknown) => {
      if (submitted || !item) return;
      const ok = gradeItem(item, response);
      setLastCorrect(MODE_META[item.mode].scored ? ok : null);
      if (ok && MODE_META[item.mode].scored) setCorrectCount(c => c + 1);
      setSubmitted(true);
    },
    [submitted, item],
  );

  const next = useCallback(() => {
    const n = index + 1;
    if (n >= total) setIsComplete(true);
    else { setIndex(n); setSubmitted(false); setLastCorrect(null); }
  }, [index, total]);

  const prev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); setSubmitted(false); setLastCorrect(null); }
  }, [index]);

  const restart = useCallback(() => {
    setSeed(s => s + 1);
    setIndex(0); setSubmitted(false); setLastCorrect(null); setCorrectCount(0); setIsComplete(false);
  }, []);

  return {
    isAvailable: total > 0,
    items, item, index, total, progress,
    submitted, lastCorrect,
    correctCount, scoredTotal, scorePct, isComplete,
    submit, next, prev, restart,
  };
}
