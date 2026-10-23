import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * "Now", refreshed each time the app returns to the foreground — so date-driven UI
 * (greeting, date label, daily verse, Sunday card) doesn't freeze at mount time
 * when the app sits in the background overnight.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setNow(new Date()); });
    return () => sub.remove();
  }, []);
  return now;
}
