import { useCallback, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

import { useRecordStudy } from './useCards';
import { getErrorMessage } from '../api';
import type { Card, Difficulty } from '../types';

interface StudySessionResult {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export function useStudySession(cards: Card[], setId: string) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [retryCards, setRetryCards] = useState<Card[]>([]);
  const [results, setResults] = useState<StudySessionResult>({
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
  });

  const { mutate: recordStudy } = useRecordStudy(setId);

  const displayCards = useMemo(() => {
    if (isRetryMode) return retryCards;
    if (!isShuffled || shuffleOrder.length !== cards.length) return cards;
    return shuffleOrder.map(i => cards[i]);
  }, [cards, retryCards, isRetryMode, isShuffled, shuffleOrder]);

  const currentCard = displayCards[currentIndex];
  const progress = displayCards.length > 0 ? currentIndex / displayCards.length : 0;

  const handleFlip = useCallback((revealed: boolean) => {
    setIsRevealed(revealed);
  }, []);

  const handleDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (!currentCard) return;

      // Record in backend (fire and forget — don't block UX)
      recordStudy(
        { id: currentCard.id, payload: { difficulty } },
        {
          onError: err =>
            Toast.show({ type: 'error', text1: 'Could not save', text2: getErrorMessage(err) }),
        },
      );

      if (difficulty === 'HARD') {
        setHardCards(prev => [...prev, currentCard]);
      }

      setResults(prev => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));

      const next = currentIndex + 1;
      if (next >= displayCards.length) {
        setIsComplete(true);
      } else {
        setIsRevealed(false);
        setCurrentIndex(next);
      }
    },
    [currentCard, currentIndex, displayCards.length, recordStudy],
  );

  const handleSkip = useCallback(() => {
    setSkippedCount(prev => prev + 1);
    const next = currentIndex + 1;
    if (next >= displayCards.length) {
      setIsComplete(true);
    } else {
      setIsRevealed(false);
      setCurrentIndex(next);
    }
  }, [currentIndex, displayCards.length]);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled) {
      const order = Array.from({ length: cards.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      setShuffleOrder(order);
      setIsShuffled(true);
    } else {
      setIsShuffled(false);
    }
    setCurrentIndex(0);
    setIsRevealed(false);
  }, [isShuffled, cards.length]);

  const handleRestart = useCallback(() => {
    if (isShuffled) {
      const order = Array.from({ length: cards.length }, (_, i) => i).sort(() => Math.random() - 0.5);
      setShuffleOrder(order);
    }
    setIsRetryMode(false);
    setRetryCards([]);
    setHardCards([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setSkippedCount(0);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  }, [isShuffled, cards.length]);

  const handleRetryHard = useCallback(() => {
    setRetryCards(hardCards);
    setIsRetryMode(true);
    setHardCards([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setSkippedCount(0);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  }, [hardCards]);

  return {
    // State
    currentCard,
    currentIndex,
    isRevealed,
    isComplete,
    isShuffled,
    isRetryMode,
    progress,
    results,
    skippedCount,
    hardCards,
    displayCards,

    // Handlers
    handleFlip,
    handleDifficulty,
    handleSkip,
    toggleShuffle,
    handleRestart,
    handleRetryHard,
  };
}
