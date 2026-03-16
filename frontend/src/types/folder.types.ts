export interface Folder {
  id: string;
  name: string;
  userId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderPayload {
  name: string;
  parentId?: string;
}

export interface UpdateFolderPayload {
  name?: string;
  parentId?: string | null;
}
