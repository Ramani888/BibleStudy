export const NOTE_PREDEFINED_TAGS = [
  'Theology', 'Old Testament', 'New Testament',
  'Prayer', 'History', 'Devotional', 'Prophecy',
] as const;

export type NotePredefinedTag = typeof NOTE_PREDEFINED_TAGS[number];

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title: string;
  body: string;
  tags?: string[];
}

export interface UpdateNotePayload {
  title?: string;
  body?: string;
  tags?: string[];
}
