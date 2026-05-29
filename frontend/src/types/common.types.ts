export type Visibility = 'PRIVATE' | 'PUBLIC' | 'FRIENDS';

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
