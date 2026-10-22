import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useSets, useCreateSet } from './useSets';
import { useCreateCard } from './useCards';
import { getErrorMessage } from '../api/client';
import verses from '../data/dailyVerses.json';

export interface DailyVerse { ref: string; text: string }

const ADDED_KEY = '@bsp/daily_verse_added'; // ref memorized today
const USED_KEY = '@bsp/daily_verse_used';   // any memorize/share yet → hides the NEW tag

/** Local day-of-year, so the verse flips at the user's midnight, not UTC's. */
function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
}

/**
 * Today's verse from the bundled WEB list (offline, same verse for everyone on a
 * given date). "Memorize" files it as a card in the user's "Daily verses" set,
 * creating that set on first use.
 */
export function useDailyVerse() {
  const { t } = useTranslation('home');
  const verse = useMemo<DailyVerse>(() => {
    const list = verses as DailyVerse[];
    return list[dayOfYear(new Date()) % list.length];
  }, []);

  const { data: sets } = useSets();
  const createSet = useCreateSet();
  const createCard = useCreateCard();
  const [added, setAdded] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([ADDED_KEY, USED_KEY])
      .then(([[, addedRef], [, used]]) => {
        setAdded(addedRef === verse.ref);
        setIsNew(!used);
      })
      .catch(() => {});
  }, [verse.ref]);

  const markUsed = useCallback(() => {
    setIsNew(false);
    AsyncStorage.setItem(USED_KEY, '1').catch(() => {});
  }, []);

  const memorize = useCallback(async () => {
    if (added || busy) return;
    setBusy(true);
    try {
      const setTitle = t('verse.setTitle');
      const setId = sets?.find(s => s.title === setTitle)?.id
        ?? (await createSet.mutateAsync({ title: setTitle })).id;
      await createCard.mutateAsync({ setId, question: verse.ref, answer: verse.text, note: t('verse.translation') });
      setAdded(true);
      markUsed();
      AsyncStorage.setItem(ADDED_KEY, verse.ref).catch(() => {});
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  }, [added, busy, sets, createSet, createCard, verse, t, markUsed]);

  const share = useCallback(() => {
    markUsed();
    Share.share({ message: `“${verse.text}”\n— ${verse.ref} (${t('verse.translationShort')})` }).catch(() => {});
  }, [verse, t, markUsed]);

  return { verse, added, isNew, busy, memorize, share };
}
