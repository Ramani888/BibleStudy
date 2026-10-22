import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api';
import type { CreateNotePayload } from '../types';

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: notesApi.list,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
  });
}

/** Create (no id yet) or update one note. The id is passed per call so an autosave right after the
 * first create updates that note instead of creating a second one. */
export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: CreateNotePayload }) =>
      id ? notesApi.update(id, payload) : notesApi.create(payload),
    onSuccess: note => {
      qc.invalidateQueries({ queryKey: ['notes'], exact: true });
      qc.setQueryData(['notes', note.id], note);
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}
