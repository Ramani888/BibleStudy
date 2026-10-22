import { z } from 'zod';

export const CreateReportDto = z.object({
  reportedId: z.string().uuid('Invalid user id'),
  reason: z.enum(['HATEFUL', 'SPAM', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'OTHER']),
  note: z.string().trim().max(500, 'Max 500 characters').optional(),
});

export type CreateReportDtoType = z.infer<typeof CreateReportDto>;
