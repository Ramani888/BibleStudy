/** Mirrors backend ReportReason (reports.dto.ts). */
export type ReportReason = 'HATEFUL' | 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'IMPERSONATION' | 'OTHER';

export interface CreateReportPayload {
  reportedId: string;
  reason: ReportReason;
  note?: string;
}
