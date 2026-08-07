import { z } from 'zod';

const SummaryItemDto = z.object({
  index:         z.number().int(),
  mode:          z.string(),
  prompt:        z.string(),
  isCorrect:     z.boolean(),
  userAnswer:    z.string(),
  correctAnswer: z.string(),
});

export const RecordAttemptDto = z
  .object({
    setIds:    z.array(z.string().min(1)).min(1, 'at least one setId required'),
    total:     z.number().int().positive('total must be a positive integer'),
    correct:   z.number().int().min(0, 'correct cannot be negative'),
    mode:      z.string().max(30).optional(),
    quizName:  z.string().max(100).optional(),
    timeSecs:  z.number().int().min(0).optional(),
    responses: z.array(SummaryItemDto).optional(),
  })
  .refine(d => d.correct <= d.total, {
    message: 'correct cannot exceed total',
    path: ['correct'],
  });

export type RecordAttemptDtoType = z.infer<typeof RecordAttemptDto>;
