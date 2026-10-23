/**
 * True when a list should show its "did not load / Try again" state: a real error, OR offline
 * with nothing saved — React Query then pauses the query (isPending + fetchStatus 'paused'),
 * which is neither loading nor errored, so screens wrongly fell through to their EMPTY state.
 */
export function loadFailed(q: { isError: boolean; isPending: boolean; fetchStatus: string }): boolean {
  return q.isError || (q.isPending && q.fetchStatus === 'paused');
}
