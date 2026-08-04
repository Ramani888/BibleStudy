import { useCallback, useMemo, useState } from 'react';
import type { Card, QuizQuestion } from '../types';

/** A set needs at least this many cards to build 4-option questions (1 correct + 3 distractors). */
export const MIN_QUIZ_CARDS = 4;
const OPTION_COUNT = 4;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One multiple-choice question per card; distractors are other cards' answers in the pool. */
function buildQuestions(cards: Card[]): QuizQuestion[] {
  return shuffle(cards).map(card => {
    // Unique answers from the other cards, excluding any equal to the correct answer.
    const pool = Array.from(
      new Set(
        cards
          .filter(c => c.id !== card.id && c.answer !== card.answer)
          .map(c => c.answer),
      ),
    );
    const distractors = shuffle(pool).slice(0, OPTION_COUNT - 1);
    const options = shuffle([card.answer, ...distractors]);
    return {
      cardId: card.id,
      prompt: card.question,
      options,
      answerIndex: options.indexOf(card.answer),
    };
  });
}

export function useQuizSession(cards: Card[]) {
  const isAvailable = cards.length >= MIN_QUIZ_CARDS;

  // Bumping the seed reshuffles questions/options for a fresh retake.
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () => (isAvailable ? buildQuestions(cards) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, seed, isAvailable],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const question = questions[currentIndex];
  const total = questions.length;
  const answered = selectedIndex !== null;
  const isCorrect = answered && question ? selectedIndex === question.answerIndex : false;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const pick = useCallback(
    (index: number) => {
      if (selectedIndex !== null || !question) return; // locked after first pick
      setSelectedIndex(index);
      if (index === question.answerIndex) {
        setCorrectCount(c => c + 1);
      }
    },
    [selectedIndex, question],
  );

  const next = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= total) {
      setIsComplete(true);
    } else {
      setCurrentIndex(nextIndex);
      setSelectedIndex(null);
    }
  }, [currentIndex, total]);

  const restart = useCallback(() => {
    setSeed(s => s + 1);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setCorrectCount(0);
    setIsComplete(false);
  }, []);

  return {
    isAvailable,
    question,
    currentIndex,
    total,
    progress,
    selectedIndex,
    answered,
    isCorrect,
    correctCount,
    isComplete,
    scorePct,
    pick,
    next,
    restart,
  };
}
