export type MediaFileType = 'IMAGE' | 'PDF';

export interface MediaFile {
  id: string;
  userId: string;
  key: string;
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  type: MediaFileType;
  createdAt: string;
  expiresAt: string | null;
}

export interface StorageUsage {
  used: number;
  limit: number;
  percent: number;
}
