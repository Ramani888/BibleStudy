import { useCallback, useEffect, useRef, useState } from 'react';
import { useAchievements } from './useAchievements';
import type { Achievement } from '../types';

/**
 * Detects achievements that unlock during this session and queues them for
 * display one at a time. The first successful fetch seeds the "already seen"
 * baseline so pre-existing unlocks never trigger a modal.
 */
export function useNewAchievements() {
  const { data } = useAchievements();
  const seenKeys = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!data) return;

    const currentUnlocked = data.filter(a => a.unlocked);

    // First fetch: establish baseline — no modal for existing achievements.
    if (seenKeys.current === null) {
      seenKeys.current = new Set(currentUnlocked.map(a => a.key));
      return;
    }

    const newOnes = currentUnlocked.filter(a => !seenKeys.current!.has(a.key));
    if (newOnes.length === 0) return;

    newOnes.forEach(a => seenKeys.current!.add(a.key));
    setQueue(prev => [...prev, ...newOnes]);
  }, [data]);

  const dismiss = useCallback(() => {
    setQueue(prev => prev.slice(1));
  }, []);

  return { achievement: queue[0] ?? null, dismiss };
}
