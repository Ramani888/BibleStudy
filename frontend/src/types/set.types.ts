export type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';
export type CardLayout = 'DEFAULT' | 'MINIMAL' | 'DETAILED';

export interface StudySet {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  folderId: string | null;
  visibility: Visibility;
  layout: CardLayout;
  createdAt: string;
  updatedAt: string;
  _count?: { cards: number };
}

export interface CreateSetPayload {
  title: string;
  description?: string;
  folderId?: string;
  visibility?: Visibility;
  layout?: CardLayout;
}

export interface UpdateSetPayload {
  title?: string;
  description?: string;
  folderId?: string | null;
  visibility?: Visibility;
  layout?: CardLayout;
}
