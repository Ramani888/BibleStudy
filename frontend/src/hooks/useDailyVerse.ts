import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useSets, useCreateSet } from './useSets';
import { useCreateCard } from './useCards';
import { useNow } from './useNow';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../store/auth.store';


export interface DailyVerse { ref: string; text: string }

// Same verse order in every file (built from public-domain / free Bibles via getbible.net),
// so everyone sees the same passage on a given day, in their own language. Only the active
// language's file is loaded (static requires so Metro bundles them).
function versesFor(lang: string): DailyVerse[] {
  switch (lang) {
    case 'es': return require('../data/dailyVerses.es.json');
    case 'pt': return require('../data/dailyVerses.pt.json');
    case 'fr': return require('../data/dailyVerses.fr.json');
    case 'ko': return require('../data/dailyVerses.ko.json');
    case 'tl': return require('../data/dailyVerses.tl.json');
    default:   return require('../data/dailyVerses.json');
  }
}

// Per user — a shared phone must not show the last user's verse as already added.
const ADDED_KEY = '@bsp/daily_verse_added'; // local date whose verse was memorized (same in every language)
const USED_KEY = '@bsp/daily_verse_used';   // any memorize/share yet → hides the NEW tag

/** Local day-of-year, so the verse flips at the user's midnight, not UTC's. */
function dayOfYear(d: Date): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
}

/**
 * Today's verse from the bundled per-language lists (offline, same verse for everyone on a
 * given date). "Memorize" files it as a card in the user's "Daily verses" set,
 * creating that set on first use.
 */
export function useDailyVerse() {
  const { t, i18n } = useTranslation('home');
  const now = useNow();
  const day = dayOfYear(now);
  const year = now.getFullYear();
  const lang = i18n.language?.slice(0, 2);
  const { verse, verseId } = useMemo(() => {
    const list = versesFor(lang);
    return { verse: list[day % list.length], verseId: `${year}-${day}` };
  }, [day, lang, year]);

  const { data: sets } = useSets();
  const createSet = useCreateSet();
  const createCard = useCreateCard();
  const [added, setAdded] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const userId = useAuthStore(s => s.user?.id ?? '');
  const addedKey = `${ADDED_KEY}:${userId}`;
  const usedKey = `${USED_KEY}:${userId}`;

  useEffect(() => {
    if (!userId) return; // no shared, user-less keys
    AsyncStorage.multiGet([addedKey, usedKey])
      .then(([[, addedRef], [, used]]) => {
        setAdded(addedRef === verseId);
        setIsNew(!used);
      })
      .catch(() => {});
  }, [verseId, addedKey, usedKey, userId]);

  const markUsed = useCallback(() => {
    setIsNew(false);
    AsyncStorage.setItem(usedKey, '1').catch(() => {});
  }, [usedKey]);

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
      AsyncStorage.setItem(addedKey, verseId).catch(() => {});
    } catch (e) {
      Toast.show({ type: 'error', text1: getErrorMessage(e) });
    } finally {
      setBusy(false);
    }
  }, [added, busy, sets, createSet, createCard, verse, verseId, t, markUsed, addedKey]);

  const share = useCallback(() => {
    markUsed();
    Share.share({ message: `“${verse.text}”\n— ${verse.ref} (${t('verse.translationShort')})` }).catch(() => {});
  }, [verse, t, markUsed]);

  return { verse, added, isNew, busy, memorize, share };
}
