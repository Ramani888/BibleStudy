import { apiGet } from './client';
import type { Achievement } from '../types';

export const achievementsApi = {
  getAll: () => apiGet<Achievement[]>('/achievements'),
};
