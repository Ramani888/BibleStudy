import { z } from 'zod';

export const RecordAttemptDto = z
  .object({
    setId:   z.string().min(1, 'setId is required'),
    total:   z.number().int().positive('total must be a positive integer'),
    correct: z.number().int().min(0, 'correct cannot be negative'),
  })
  .refine(d => d.correct <= d.total, {
    message: 'correct cannot exceed total',
    path: ['correct'],
  });

export type RecordAttemptDtoType = z.infer<typeof RecordAttemptDto>;
