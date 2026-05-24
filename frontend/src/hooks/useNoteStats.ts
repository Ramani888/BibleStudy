import { useNotes } from './useNotes';

export function useNoteStats() {
  const { data: notes = [] } = useNotes();
  return { totalNotes: notes.length };
}
