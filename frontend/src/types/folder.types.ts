export interface Folder {
  id: string;
  name: string;
  color: string | null;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderPayload {
  name: string;
  parentId?: string;
  color?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  parentId?: string | null;
  color?: string | null;
}
