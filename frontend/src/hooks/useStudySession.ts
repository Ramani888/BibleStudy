import { useCallback, useEffect, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

import { useRecordStudy } from './useCards';
import { getErrorMessage } from '../api';
import type { Card, Difficulty } from '../types';

interface StudySessionResult {
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

function fisherYates(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useStudySession(cards: Card[], setId: string, isOwner = true) {
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
  const progress = displayCards.length > 0 ? (currentIndex + 1) / displayCards.length : 0;

  const handleFlip = useCallback((revealed: boolean) => {
    setIsRevealed(revealed);
  }, []);

  const handleDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (!currentCard) return;

      // Record in backend only for owners — non-owners study in visual-only mode
      if (isOwner) {
        recordStudy(
          { id: currentCard.id, payload: { difficulty } },
          {
            onError: err =>
              Toast.show({ type: 'error', text1: 'Could not save', text2: getErrorMessage(err) }),
          },
        );
      }

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
    [currentCard, currentIndex, displayCards.length, recordStudy, isOwner],
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
      setShuffleOrder(fisherYates(cards.length));
      setIsShuffled(true);
    } else {
      setIsShuffled(false);
    }
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setHardCards([]);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
    setSkippedCount(0);
  }, [isShuffled, cards.length]);

  const handleRestart = useCallback(() => {
    if (isShuffled) {
      setShuffleOrder(fisherYates(cards.length));
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
    if (hardCards.length === 0) return;
    setRetryCards(hardCards);
    setIsRetryMode(true);
    setHardCards([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsComplete(false);
    setSkippedCount(0);
    setResults({ EASY: 0, MEDIUM: 0, HARD: 0 });
  }, [hardCards]);

  // Rebuild shuffle order when cards array grows/shrinks while shuffle is active
  useEffect(() => {
    if (isShuffled && shuffleOrder.length !== cards.length) {
      setShuffleOrder(fisherYates(cards.length));
      setCurrentIndex(0);
    }
  }, [cards.length, isShuffled, shuffleOrder.length]);

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
