import { useCallback, useState } from 'react';

/**
 * The show/hide search-field pattern used across list screens: a `query`
 * string, a `visible` flag, and a `toggle` that clears the query when hiding.
 */
export function useSearchToggle() {
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(false);

  const toggle = useCallback(() => {
    setVisible(v => {
      if (v) setQuery('');
      return !v;
    });
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setVisible(false);
  }, []);

  return { query, setQuery, visible, toggle, clear };
}
