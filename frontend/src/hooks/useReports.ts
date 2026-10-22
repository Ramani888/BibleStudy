import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '../api';
import type { CreateReportPayload } from '../types';

/** Report a user (stored for review + emailed to support). Nothing to invalidate. */
export function useReportUser() {
  return useMutation({ mutationFn: (payload: CreateReportPayload) => reportsApi.create(payload) });
}
