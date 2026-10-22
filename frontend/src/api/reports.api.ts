import { apiPost } from './client';
import type { CreateReportPayload } from '../types/report.types';

export const reportsApi = {
  create: (payload: CreateReportPayload) => apiPost<{ id: string }>('/reports', payload),
};
